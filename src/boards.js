import * as THREE from 'https://cdn.skypack.dev/three@0.158.0';
import state from './state.js';

const BOARD_WIDTH = 1.0;
const BOARD_HEIGHT = 0.6;
const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 620;

function createBaseMaterial(canvas) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.encoding = THREE.sRGBEncoding;
  return new THREE.MeshBasicMaterial({ map: texture, transparent: true });
}

function drawBoardBackground(board) {
  const { ctx, canvas } = board;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = board.isSelected ? 'rgba(210,230,255,0.95)' : 'rgba(255,255,255,0.92)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = board.isSelected ? '#1b6ef3' : 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);

  ctx.fillStyle = '#111';
  ctx.font = 'bold 48px "Helvetica Neue", Arial, sans-serif';
  ctx.textBaseline = 'top';
  const title = board.title || '';
  wrapText(ctx, title, 40, 40, canvas.width - 80, 56);

  ctx.font = '32px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = '#222';
  const bodyY = 140;
  wrapText(ctx, board.body || '', 40, bodyY, canvas.width - 80, 44);
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = (text || '').split(/\s+/);
  let line = '';
  let drawY = y;
  for (let i = 0; i < words.length; i += 1) {
    const testLine = line ? `${line} ${words[i]}` : words[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && i > 0) {
      ctx.fillText(line, x, drawY);
      line = words[i];
      drawY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, x, drawY);
  }
}

function updateTexture(board) {
  if (board.mesh && board.mesh.material && board.mesh.material.map) {
    board.mesh.material.map.needsUpdate = true;
  }
}

function handleImage(board) {
  if (!board.imageUrl) {
    return;
  }
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    const { ctx, canvas } = board;
    const maxWidth = canvas.width - 120;
    const maxHeight = 240;
    const x = 60;
    const y = canvas.height - maxHeight - 60;
    let drawWidth = maxWidth;
    let drawHeight = (img.height / img.width) * drawWidth;
    if (drawHeight > maxHeight) {
      drawHeight = maxHeight;
      drawWidth = (img.width / img.height) * drawHeight;
    }
    const offsetX = x + (maxWidth - drawWidth) / 2;
    const offsetY = y + (maxHeight - drawHeight) / 2;
    board.ctx.fillStyle = 'rgba(0,0,0,0.08)';
    board.ctx.fillRect(x, y, maxWidth, maxHeight);
    board.ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    updateTexture(board);
  };
  img.src = board.imageUrl;
}

export function createBoard({ title, body, imageUrl, type, position }) {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext('2d');

  const material = createBaseMaterial(canvas);
  const geometry = new THREE.PlaneGeometry(BOARD_WIDTH, BOARD_HEIGHT);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position || new THREE.Vector3(0, 1.6, -1.5));
  if (state.camera) {
    mesh.lookAt(state.camera.position.x, mesh.position.y, state.camera.position.z);
  }
  mesh.userData.type = 'board';

  const board = {
    mesh,
    title: title || 'Board',
    body: body || '',
    imageUrl: imageUrl || null,
    type: type || 'note',
    canvas,
    ctx,
    isSelected: false
  };
  mesh.userData.board = board;

  state.scene.add(mesh);
  state.boards.push(board);

  redrawBoard(board);
  return board;
}

export function redrawBoard(board) {
  drawBoardBackground(board);
  if (board.imageUrl) {
    handleImage(board);
  }
  updateTexture(board);
}

export function updateBoardBody(board, newBody, append = true) {
  if (!board) return;
  if (append) {
    board.body = board.body ? `${board.body}\n\n${newBody}` : newBody;
  } else {
    board.body = newBody;
  }
  redrawBoard(board);
}

export function spawnBoardInFrontOfUser(title, body, imageUrl, type = 'note') {
  const camera = state.camera;
  if (!camera) return null;
  const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
  const position = new THREE.Vector3().copy(camera.position).add(direction.multiplyScalar(1.5));
  position.y = Math.max(1.1, position.y);
  return createBoard({ title, body, imageUrl, type, position });
}

export function spawnBoardArcAroundUser(items) {
  const camera = state.camera;
  if (!camera) return;
  const radius = 2.2;
  const startAngle = -Math.PI / 3;
  const endAngle = Math.PI / 3;
  const step = items.length > 1 ? (endAngle - startAngle) / (items.length - 1) : 0;

  items.forEach((item, index) => {
    const angle = startAngle + step * index;
    const x = camera.position.x + Math.sin(angle) * radius;
    const z = camera.position.z - Math.cos(angle) * radius;
    const position = new THREE.Vector3(x, 1.6, z);
    const board = createBoard({
      title: item.title || 'Memory',
      body: item.summary || '',
      imageUrl: null,
      type: 'note',
      position
    });
    board.mesh.lookAt(camera.position.x, 1.6, camera.position.z);
  });
}

export function setSelectedBoard(board) {
  state.selectedBoard = board;
  state.boards.forEach((b) => {
    b.isSelected = b === board;
    redrawBoard(b);
  });
}

export function updateSpeechBubbleText(text) {
  const mesh = state.speechBubbleMesh;
  if (!mesh || !mesh.userData) return;
  const { canvas, ctx } = mesh.userData;
  if (!canvas || !ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  const radius = 30;
  roundedRect(ctx, 0, 0, canvas.width, canvas.height, radius);
  ctx.fillStyle = '#111';
  ctx.font = 'bold 40px "Helvetica Neue", Arial, sans-serif';
  ctx.textBaseline = 'top';
  const displayText = text.length > 400 ? `${text.slice(0, 400)}…` : text;
  wrapText(ctx, displayText, 40, 40, canvas.width - 80, 48);
  if (mesh.material && mesh.material.map) {
    mesh.material.map.needsUpdate = true;
  }
  mesh.material.opacity = 1;
  mesh.visible = true;
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  mesh.userData.expiresAt = now + 8000;
}

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
}
