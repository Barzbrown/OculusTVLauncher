import * as THREE from 'https://cdn.skypack.dev/three@0.158.0';
import { VRButton } from 'https://cdn.skypack.dev/three@0.158.0/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'https://cdn.skypack.dev/three@0.158.0/examples/jsm/webxr/XRControllerModelFactory.js';

import state from './state.js';
import { buildWristMenu } from './tools.js';
import { updateRaycast, pollGamepads, setupControllerEvents, teardownControllerEvents } from './input.js';
import { spawnBoardInFrontOfUser, updateSpeechBubbleText } from './boards.js';

let renderer;
let scene;
let camera;
let avatarGroup;
const lookTarget = new THREE.Vector3();

init();
animate();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);
  scene.fog = new THREE.Fog(0xffffff, 6, 25);
  state.scene = scene;

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 1.6, 0);
  state.camera = camera;

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.xr.enabled = true;
  state.renderer = renderer;

  document.body.appendChild(renderer.domElement);
  document.body.appendChild(VRButton.createButton(renderer));

  const ambient = new THREE.HemisphereLight(0xffffff, 0xf0f0f0, 0.8);
  scene.add(ambient);
  const directional = new THREE.DirectionalLight(0xffffff, 0.6);
  directional.position.set(5, 10, 7);
  scene.add(directional);

  const grid = new THREE.GridHelper(200, 200, 0xeeeeee, 0xf5f5f5);
  grid.position.y = 0;
  grid.material.opacity = 0.25;
  grid.material.transparent = true;
  scene.add(grid);

  const floorGeometry = new THREE.PlaneGeometry(200, 200);
  const floorMaterial = new THREE.MeshBasicMaterial({ color: 0xfafafa, transparent: true, opacity: 0.8 });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  createNovaAvatar();
  setupControllers();

  window.addEventListener('resize', onWindowResize);
}

function createNovaAvatar() {
  avatarGroup = new THREE.Group();
  avatarGroup.position.set(0, 1.6, -2);
  scene.add(avatarGroup);

  const avatarCanvas = document.createElement('canvas');
  avatarCanvas.width = 512;
  avatarCanvas.height = 768;
  const avatarCtx = avatarCanvas.getContext('2d');
  avatarCtx.fillStyle = '#f1f5ff';
  avatarCtx.fillRect(0, 0, avatarCanvas.width, avatarCanvas.height);
  avatarCtx.fillStyle = '#4a6cf7';
  avatarCtx.font = 'bold 80px "Helvetica Neue", Arial, sans-serif';
  avatarCtx.textAlign = 'center';
  avatarCtx.fillText('NOVA', avatarCanvas.width / 2, avatarCanvas.height / 2);

  const avatarTexture = new THREE.CanvasTexture(avatarCanvas);
  avatarTexture.encoding = THREE.sRGBEncoding;
  const avatarMaterial = new THREE.MeshBasicMaterial({ map: avatarTexture, transparent: true });
  const avatarMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.4), avatarMaterial);
  avatarMesh.position.set(0, 0, 0);
  avatarGroup.add(avatarMesh);

  const mouthMaterial = new THREE.MeshBasicMaterial({ color: 0xff9aa2, transparent: true });
  const mouthMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.08), mouthMaterial);
  mouthMesh.position.set(0, -0.2, 0.02);
  avatarMesh.add(mouthMesh);

  const bubbleCanvas = document.createElement('canvas');
  bubbleCanvas.width = 512;
  bubbleCanvas.height = 256;
  const bubbleCtx = bubbleCanvas.getContext('2d');
  bubbleCtx.clearRect(0, 0, bubbleCanvas.width, bubbleCanvas.height);
  const bubbleTexture = new THREE.CanvasTexture(bubbleCanvas);
  bubbleTexture.encoding = THREE.sRGBEncoding;
  const bubbleMaterial = new THREE.MeshBasicMaterial({ map: bubbleTexture, transparent: true, opacity: 0 });
  const bubbleMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.45), bubbleMaterial);
  bubbleMesh.position.set(0.7, 0.5, 0);
  bubbleMesh.visible = false;
  bubbleMesh.userData = { canvas: bubbleCanvas, ctx: bubbleCtx, expiresAt: 0 };
  avatarGroup.add(bubbleMesh);

  state.novaAvatarMesh = avatarMesh;
  state.novaAvatarMouthMesh = mouthMesh;
  state.speechBubbleMesh = bubbleMesh;
  state.avatarTexture = avatarTexture;
}

function setupControllers() {
  const controllerModelFactory = new XRControllerModelFactory();
  for (let i = 0; i < 2; i += 1) {
    const controller = renderer.xr.getController(i);
    controller.addEventListener('connected', function onConnected(event) {
      const handedness = event.data.handedness;
      this.userData.handedness = handedness;
      if (handedness === 'left') {
        state.leftController = this;
        buildWristMenu(this);
      } else if (handedness === 'right') {
        state.rightController = this;
        setupControllerEvents();
      }
    });
    controller.addEventListener('disconnected', function onDisconnected() {
      if (state.leftController === this) {
        state.leftController = null;
      }
      if (state.rightController === this) {
        teardownControllerEvents(this);
        state.rightController = null;
      }
    });
    scene.add(controller);

    const controllerGrip = renderer.xr.getControllerGrip(i);
    controllerGrip.add(controllerModelFactory.createControllerModel(controllerGrip));
    scene.add(controllerGrip);
  }
}

function animate() {
  renderer.setAnimationLoop(renderLoop);
}

function renderLoop() {
  updateRaycast();
  pollGamepads();
  billboardAvatar();
  updateSpeechBubbleFade();
  renderer.render(scene, camera);
}

function billboardAvatar() {
  if (!avatarGroup || !camera) return;
  lookTarget.set(camera.position.x, avatarGroup.position.y, camera.position.z);
  avatarGroup.lookAt(lookTarget);
  if (state.speechBubbleMesh) {
    state.speechBubbleMesh.lookAt(camera.position);
  }
}

function updateSpeechBubbleFade() {
  const bubble = state.speechBubbleMesh;
  if (!bubble || !bubble.material) return;
  if (!bubble.visible) return;
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const expiresAt = bubble.userData.expiresAt || 0;
  if (!expiresAt) return;
  const remaining = expiresAt - now;
  if (remaining <= 0) {
    bubble.visible = false;
    bubble.material.opacity = 0;
    return;
  }
  if (remaining < 1500) {
    bubble.material.opacity = Math.max(0, remaining / 1500);
  }
}

function onWindowResize() {
  if (!renderer || !camera) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Convenience: start with a welcome board in front of the user once the scene is ready
setTimeout(() => {
  spawnBoardInFrontOfUser('Welcome to Nova Construct', 'Use your left wrist menu to create boards, sketch, and collaborate with Nova.', null, 'note');
  updateSpeechBubbleText('Hi! I am Nova. Summon me with ASK_NOVA to expand any board.');
}, 1000);
