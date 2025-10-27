import * as THREE from 'https://cdn.skypack.dev/three@0.158.0';
import state from './state.js';
import { spawnBoardInFrontOfUser, spawnBoardArcAroundUser, updateBoardBody } from './boards.js';
import { sendChat, webSearch, generateImage, uploadFile, fetchMemory, openExternalBrowser } from './api.js';

const BUTTON_IDS = [
  'NEW_BOARD',
  'UPLOAD_FILE',
  'ASK_NOVA',
  'WEB_SEARCH',
  'WEB_WINDOW',
  'GEN_IMAGE',
  'TOGGLE_SKETCH',
  'LOAD_MEMORY',
  'SET_AVATAR'
];

const menuButtons = [];

function makeButtonLabelTexture(label) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#202225';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 34px "Helvetica Neue", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.encoding = THREE.sRGBEncoding;
  return { canvas, texture };
}

export function buildWristMenu(controller) {
  if (state.wristMenu && state.wristMenu.parent) {
    state.wristMenu.parent.remove(state.wristMenu);
  }
  menuButtons.length = 0;
  const group = new THREE.Group();
  group.name = 'WristMenu';
  const buttonSpacing = 0.065;
  const buttonHeight = 0.05;
  const buttonWidth = 0.18;

  BUTTON_IDS.forEach((id, index) => {
    const { texture } = makeButtonLabelTexture(id);
    const geometry = new THREE.PlaneGeometry(buttonWidth, buttonHeight);
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, index * -buttonSpacing, 0);
    mesh.userData.type = 'menu-button';
    mesh.userData.id = id;
    group.add(mesh);
    menuButtons.push(mesh);
  });

  group.position.set(0.05, 0.1, 0);
  group.rotation.y = Math.PI / 2;
  controller.add(group);
  state.wristMenu = group;
  return group;
}

export function getMenuButtons() {
  return menuButtons;
}

function promptUser(message, placeholder = '') {
  if (typeof window === 'undefined') return null;
  const result = window.prompt(message, placeholder);
  if (result === null) return null;
  return result.trim();
}

async function handleUploadFlow() {
  const input = document.getElementById('fileInput');
  if (!input) return;
  input.value = '';
  input.onchange = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    try {
      const data = await uploadFile(file);
      spawnBoardInFrontOfUser(file.name, data.summary || 'Uploaded file', data.previewImageUrl || null, 'file');
    } catch (err) {
      console.error('Upload failed', err);
      window.alert('Upload failed: ' + err.message);
    }
  };
  input.click();
}

async function handleAvatarSelection() {
  const input = document.getElementById('avatarInput');
  if (!input) return;
  input.value = '';
  input.onchange = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      applyAvatarTexture(dataUrl);
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

function applyAvatarTexture(dataUrl) {
  if (!state.novaAvatarMesh) return;
  const texture = new THREE.TextureLoader().load(dataUrl, () => {
    texture.encoding = THREE.sRGBEncoding;
    texture.needsUpdate = true;
  });
  state.avatarTexture = texture;
  state.novaAvatarMesh.material.map = texture;
  state.novaAvatarMesh.material.needsUpdate = true;
}

export async function handleToolClick(id) {
  try {
    switch (id) {
      case 'NEW_BOARD':
        spawnBoardInFrontOfUser('New Board', 'Start writing…', null, 'note');
        break;
      case 'UPLOAD_FILE':
        await handleUploadFlow();
        break;
      case 'ASK_NOVA': {
        const board = state.selectedBoard;
        if (!board) break;
        const reply = await sendChat(`Explain and extend this:\n${board.body}`);
        if (reply) {
          updateBoardBody(board, reply, true);
        }
        break;
      }
      case 'WEB_SEARCH': {
        const query = promptUser('Search the web for:', '');
        if (!query) break;
        const data = await webSearch({ query });
        spawnBoardInFrontOfUser(`Web: ${query}`, data.result || 'No result', data.screenshotUrl || null, 'web');
        break;
      }
      case 'WEB_WINDOW': {
        const url = promptUser('Open which URL?', 'https://');
        if (!url) break;
        const data = await webSearch({ url });
        spawnBoardInFrontOfUser(url, data.result || 'No preview', data.screenshotUrl || null, 'web');
        openExternalBrowser(url);
        break;
      }
      case 'GEN_IMAGE': {
        const description = promptUser('Generate which image?', '');
        if (!description) break;
        const data = await generateImage(description);
        spawnBoardInFrontOfUser(`Image: ${description}`, '(generated image)', data.url || null, 'image');
        break;
      }
      case 'TOGGLE_SKETCH':
        state.sketchMode = !state.sketchMode;
        if (typeof window !== 'undefined') {
          window.alert(`Sketch mode ${state.sketchMode ? 'enabled' : 'disabled'}`);
        }
        break;
      case 'LOAD_MEMORY': {
        const data = await fetchMemory();
        if (data.items && Array.isArray(data.items)) {
          spawnBoardArcAroundUser(data.items);
        }
        break;
      }
      case 'SET_AVATAR':
        await handleAvatarSelection();
        break;
      default:
        console.warn('Unhandled wrist menu action', id);
    }
  } catch (err) {
    console.error('Tool action error', id, err);
    if (typeof window !== 'undefined') {
      window.alert(`Action failed: ${err.message}`);
    }
  }
}
