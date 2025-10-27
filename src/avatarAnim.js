import state from './state.js';

let mouthInterval = null;

export function startMouthAnimation() {
  if (mouthInterval) {
    return;
  }
  mouthInterval = setInterval(() => {
    if (state.novaAvatarMouthMesh) {
      const scale = 0.8 + Math.random() * 0.4;
      state.novaAvatarMouthMesh.scale.y = scale;
    }
  }, 80);
}

export function stopMouthAnimation() {
  if (mouthInterval) {
    clearInterval(mouthInterval);
    mouthInterval = null;
  }
  if (state.novaAvatarMouthMesh) {
    state.novaAvatarMouthMesh.scale.y = 1;
  }
}
