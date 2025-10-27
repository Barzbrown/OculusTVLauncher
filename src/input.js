import * as THREE from 'https://cdn.skypack.dev/three@0.158.0';
import state from './state.js';
import { getMenuButtons, handleToolClick } from './tools.js';
import { setSelectedBoard } from './boards.js';
import { startStroke, extendStroke, endStroke, isDrawing } from './sketch.js';

const raycaster = new THREE.Raycaster();
const tempMatrix = new THREE.Matrix4();
let pointerLine = null;
let currentHover = null;
let previousAButton = false;
let drawingActive = false;
let listenersAttached = false;

export function setupControllerEvents() {
  if (!state.rightController || listenersAttached) return;
  state.rightController.addEventListener('selectstart', onSelectStart);
  state.rightController.addEventListener('selectend', onSelectEnd);
  ensurePointer(state.rightController);
  listenersAttached = true;
}

export function teardownControllerEvents(controller) {
  const target = controller || state.rightController;
  if (target) {
    target.removeEventListener('selectstart', onSelectStart);
    target.removeEventListener('selectend', onSelectEnd);
  }
  if (pointerLine && pointerLine.parent) {
    pointerLine.parent.remove(pointerLine);
  }
  pointerLine = null;
  listenersAttached = false;
  drawingActive = false;
  previousAButton = false;
}

function ensurePointer(controller) {
  if (pointerLine || !controller) return;
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -1)
  ]);
  const material = new THREE.LineBasicMaterial({ color: 0xffffff });
  pointerLine = new THREE.Line(geometry, material);
  pointerLine.name = 'RightPointer';
  pointerLine.scale.z = 3;
  controller.add(pointerLine);
}

function onSelectStart() {
  if (state.sketchMode) {
    drawingActive = true;
    const position = getControllerWorldPosition();
    if (position) {
      startStroke(position);
    }
  } else {
    activateHover();
  }
}

function onSelectEnd() {
  if (state.sketchMode && drawingActive) {
    endStroke();
  }
  drawingActive = false;
}

function getControllerWorldPosition() {
  if (!state.rightController) return null;
  return state.rightController.getWorldPosition(new THREE.Vector3());
}

function activateHover() {
  if (!currentHover) return;
  const data = currentHover.userData || {};
  if (data.type === 'menu-button') {
    handleToolClick(data.id);
  } else if (data.board) {
    setSelectedBoard(data.board);
  }
}

export function updateRaycast() {
  if (!state.rightController || !state.camera) return;
  tempMatrix.identity().extractRotation(state.rightController.matrixWorld);
  const origin = state.rightController.getWorldPosition(new THREE.Vector3());
  const direction = new THREE.Vector3(0, 0, -1).applyMatrix4(tempMatrix).normalize();
  raycaster.set(origin, direction);

  const targets = [];
  const menu = getMenuButtons();
  if (menu && menu.length) {
    targets.push(...menu);
  }
  state.boards.forEach((board) => {
    if (board.mesh) targets.push(board.mesh);
  });

  const intersections = targets.length ? raycaster.intersectObjects(targets, false) : [];
  if (intersections.length > 0) {
    currentHover = intersections[0].object;
    if (pointerLine) {
      pointerLine.scale.z = intersections[0].distance;
    }
  } else {
    currentHover = null;
    if (pointerLine) {
      pointerLine.scale.z = 3;
    }
  }

  if (state.sketchMode && drawingActive) {
    const position = getControllerWorldPosition();
    if (position) {
      extendStroke(position);
    }
  }
}

export function pollGamepads() {
  if (!state.rightController || !state.rightController.gamepad) return;
  const gamepad = state.rightController.gamepad;
  const aButton = gamepad.buttons[4];
  const isAPressed = !!(aButton && aButton.pressed);
  if (isAPressed && !previousAButton) {
    state.sketchMode = !state.sketchMode;
    if (!state.sketchMode && isDrawing()) {
      endStroke();
      drawingActive = false;
    }
    if (typeof window !== 'undefined') {
      window.alert(`Sketch mode ${state.sketchMode ? 'enabled' : 'disabled'}`);
    }
  }
  previousAButton = isAPressed;
}
