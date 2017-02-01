/* global THREE:false, setInterval:false, navigator:false, document:false */

/**
 * @author Norihito Nishioka
 */

THREE.VRFlyControls = function(object, domElement, callback) {
  var scope = this;

  this.movementSpeed = 1.0;
  this.rollSpeed = 0.01;

  this.dragToLook = false;
  this.autoForward = false;

  this.domElement = (domElement !== undefined) ? domElement : document;
  if (domElement) {
    this.domElement.setAttribute('tabindex', -1);
  }

  // HMD detection
  var frameData = null;

  if ('VRFrameData' in window) {
    frameData = new VRFrameData();
  }

  var vrDisplay;

  function gotVRDisplays(displays) {
    if (displays.length > 0) {
      vrDisplay = displays[0];
    } else {
      if (onError) onError('VR input not available.');
    }
  }

  if (navigator.getVRDisplays) {
    navigator.getVRDisplays().then(gotVRDisplays)
    .catch(function() {
      console.warn('THREE.VRControls: Unable to get VR Displays');
    });
  }

  // game controller stuff
  var haveEvents = 'ongamepadconnected' in window;
  var haveWebkitEvents = 'WebKitGamepadEvent' in window;
  var controllers = {};

  function scangamepads() {
    var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
    for (var i = 0; i < gamepads.length; i++) {
      if (gamepads[i]) {
        controllers[gamepads[i].index] = gamepads[i];
        // console.log('scangamepads/controllers: ', controllers);
      }
    }
  }

  function gamepadconnected(e) {
    controllers[e.gamepad.index] = e.gamepad;
    // console.log('gamepadconnected/controllers: ', controllers);
  }

  function gamepaddisconnected(e) {
    // console.log('gamepaddisconnected/controllers: ', controllers);
    delete controllers[e.gamepad.index];
  }

  if (haveEvents) {
    window.addEventListener('gamepadconnected', bind(this, gamepadconnected), false);
    window.addEventListener('gamepaddisconnected', bind(this, gamepaddisconnected), false);
  } else if (haveWebkitEvents) {
    window.addEventListener('webkitgamepadconnected', bind(this, gamepadconnected), false);
    window.addEventListener('webkitgamepaddisconnected', bind(this, gamepaddisconnected), false);
  } else {
    setInterval(scangamepads, 500);
  }

  var plane = new THREE.Object3D();

  var tmpQuaternion = new THREE.Quaternion();
  var vrQuaternion = new THREE.Quaternion();
  var moveVector = new THREE.Vector3(0, 0, 0);
  var rotationVector = new THREE.Vector3(0, 0, 0);

  var moveState = {
    up: 0,
    down: 0,
    left: 0,
    right: 0,
    forward: 0,
    back: 0,
    pitchUp: 0,
    pitchDown: 0,
    yawLeft: 0,
    yawRight: 0,
    rollLeft: 0,
    rollRight: 0
  };

  function updateMovementVector() {
    var forward = moveState.forward || scope.autoForward && !moveState.back ? 1 : 0;

    moveVector.x = moveState.right - moveState.left;
    moveVector.y = moveState.up - moveState.down;
    moveVector.z = moveState.back - forward;
    // console.log('move:', [moveVector.x, moveVector.y, moveVector.z]);
  }

  function updateRotationVector() {
    rotationVector.x = moveState.pitchUp - moveState.pitchDown;
    rotationVector.y = moveState.yawLeft - moveState.yawRight;
    rotationVector.z = moveState.rollLeft - moveState.rollRight;
    // console.log('rotate:', [rotationVector.x, rotationVector.y, rotationVector.z]);
  }

  function keydown(event) {
    if (event.altKey) {
      return;
    }

    switch (event.keyCode) {
    case 16: // shift
      scope.movementSpeedMultiplier = 0.1;
      break;

    case 87: // W
      moveState.forward = 1;
      break;

    case 83: // S
      moveState.back = 1;
      break;

    case 65: // A
      moveState.left = 1;
      break;

    case 68: // D
      moveState.right = 1;
      break;

    case 82: // R
      moveState.up = 1;
      break;

    case 70: // F
      moveState.down = 1;
      break;

    case 38: // up
      moveState.pitchUp = 1;
      break;

    case 40: // down
      moveState.pitchDown = 1;
      break;

    case 37: // left
      moveState.yawLeft = 1;
      break;

    case 39: // right
      moveState.yawRight = 1;
      break;

    case 81: // Q
      moveState.rollLeft = 1;
      break;

    case 69: // E
      moveState.rollRight = 1;
      break;
    }

    updateMovementVector();
    updateRotationVector();
  }

  function keyup(event) {
    switch (event.keyCode) {
    case 16: // shift
      scope.movementSpeedMultiplier = 1;
      break;

    case 87: // W
      moveState.forward = 0;
      break;

    case 83: // S
      moveState.back = 0;
      break;

    case 65: // A
      moveState.left = 0;
      break;

    case 68: // D
      moveState.right = 0;
      break;

    case 82: // R
      moveState.up = 0;
      break;

    case 70: // F
      moveState.down = 0;
      break;

    case 38: // up
      moveState.pitchUp = 0;
      break;

    case 40: // down
      moveState.pitchDown = 0;
      break;

    case 37: // left
      moveState.yawLeft = 0;
      break;

    case 39: // right
      moveState.yawRight = 0;
      break;

    case 81: // Q
      moveState.rollLeft = 0;
      break;

    case 69: // E
      moveState.rollRight = 0;
      break;
    }

    updateMovementVector();
    updateRotationVector();
  }

  window.addEventListener('keydown', bind(this, keydown), false);
  window.addEventListener('keyup', bind(this, keyup), false);

  this.update = function(delta) {
    scope.delta = delta !== undefined ? delta : 10;

    plane.position.copy(object.position);

    for (var key in controllers) {
      var controller = controllers[key];

      // for (var i = 0; i < controller.buttons.length; i++) {
      //     var val = controller.buttons[i];
      //     var pressed = val === 1.0;
      //     if (typeof(val) === 'object') {
      //         pressed = val.pressed;
      //         val = val.value;
      //     }
      //     if (pressed) {
      //         console.log('button(' + i + ') pressed');
      //     }
      // }
      if (controller.axes[1] > 0.5 || controller.axes[1] < -0.5) {
        moveVector.z = controller.axes[1]; // forward
      }
      if (controller.axes[0] > 0.5 || controller.axes[0] < -0.5) {
        rotationVector.y = -controller.axes[0]; // yaw
      }
      if (controller.axes[2] > 0.5 || controller.axes[2] < -0.5) {
        rotationVector.z = -controller.axes[2]; // roll
      }
      if (controller.axes[3] > 0.5 || controller.axes[3] < -0.5) {
        rotationVector.x = controller.axes[3]; // pitch
      }
    }

    // console.log('moveVector/x:', moveVector.x, 'y:', moveVector.y, 'z:', moveVector.z)
    // console.log('rotationVector/x:', rotationVector.x, 'y:', rotationVector.y, 'z:', rotationVector.z)
    var moveMult = scope.delta * scope.movementSpeed;

    plane.translateX(moveVector.x * moveMult);
    plane.translateY(moveVector.y * moveMult);
    plane.translateZ(moveVector.z * moveMult);

    tmpQuaternion.set(
      rotationVector.x * scope.rollSpeed,
      rotationVector.y * scope.rollSpeed,
      rotationVector.z * scope.rollSpeed,
      1
    ).normalize();
    plane.quaternion.multiply(tmpQuaternion);

    // expose the rotation vector for convenience
    plane.rotation.setFromQuaternion(plane.quaternion, plane.rotation.order);

    object.position.copy(plane.position);

    if (vrDisplay) {
      var pose;

      if (vrDisplay.getFrameData) {
        vrDisplay.getFrameData(frameData);
        pose = frameData.pose;
      } else if (vrDisplay.getPose) {
        pose = vrDisplay.getPose();
      }

      if (pose.orientation !== null) {
        vrQuaternion.fromArray(pose.orientation);
      }
    }

    tmpQuaternion.copy(plane.quaternion);
    object.rotation.setFromQuaternion(tmpQuaternion.multiply(vrQuaternion));

    rotationVector.set(0, 0, 0);
    moveVector.set(0, 0, 0);
  };

  this.getContainerDimensions = function() {
    if (this.domElement !== document) {
      return {
        size: [this.domElement.offsetWidth, this.domElement.offsetHeight],
        offset: [this.domElement.offsetLeft, this.domElement.offsetTop]
      };
    } else {
      return {
        size: [window.innerWidth, window.innerHeight],
        offset: [0, 0]
      };
    }
  };

  function bind(scope, fn) {
    return function() {
      fn.apply(scope, arguments);
    };
  }

  this.domElement.addEventListener('contextmenu', function(event) {
    event.preventDefault();
  }, false);
};
