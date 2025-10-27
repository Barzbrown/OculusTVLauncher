import * as THREE from 'https://cdn.skypack.dev/three@0.158.0';
import state from './state.js';

let currentStroke = null;

export function startStroke(position) {
  if (!state.scene) return;
  currentStroke = {
    points: [position.clone()],
    geometry: new THREE.BufferGeometry(),
    material: new THREE.LineBasicMaterial({ color: 0x3f8cff, linewidth: 6 })
  };
  updateGeometry(currentStroke);
  currentStroke.line = new THREE.Line(currentStroke.geometry, currentStroke.material);
  state.scene.add(currentStroke.line);
}

export function extendStroke(position) {
  if (!currentStroke) return;
  const lastPoint = currentStroke.points[currentStroke.points.length - 1];
  if (lastPoint.distanceToSquared(position) < 0.0001) {
    return;
  }
  currentStroke.points.push(position.clone());
  updateGeometry(currentStroke);
}

export function endStroke() {
  if (!currentStroke) return;
  state.sketchStrokes.push(currentStroke.line);
  currentStroke = null;
}

function updateGeometry(stroke) {
  const positions = new Float32Array(stroke.points.length * 3);
  stroke.points.forEach((point, index) => {
    positions[index * 3 + 0] = point.x;
    positions[index * 3 + 1] = point.y;
    positions[index * 3 + 2] = point.z;
  });
  stroke.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  stroke.geometry.setDrawRange(0, stroke.points.length);
  stroke.geometry.attributes.position.needsUpdate = true;
  stroke.geometry.computeBoundingSphere();
}

export function isDrawing() {
  return !!currentStroke;
}
