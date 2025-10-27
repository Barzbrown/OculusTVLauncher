const { THREE, VRButton } = window;

if (!THREE || !VRButton) {
  console.error(
    "Three.js or VRButton failed to load. Check your network connection and reload the page."
  );
} else {
  initScene();
}

function initScene() {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  renderer.domElement.style.maxWidth = "100%";
  renderer.domElement.style.borderRadius = "18px";
  renderer.domElement.style.boxShadow = "0 20px 60px rgba(0, 0, 0, 0.35)";

  document.body.appendChild(renderer.domElement);
  document.body.appendChild(VRButton.createButton(renderer));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b101b);

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 1.6, 3);

  const light = new THREE.HemisphereLight(0xffffff, 0x1b2a44, 1.4);
  scene.add(light);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(6, 48),
    new THREE.MeshStandardMaterial({ color: 0x1d2a3f, roughness: 0.8 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const launcher = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.7, 0.05),
    new THREE.MeshStandardMaterial({ color: 0x3560ff, metalness: 0.2, roughness: 0.4 })
  );
  launcher.position.set(0, 1.5, -1.2);
  scene.add(launcher);

  const glow = new THREE.Mesh(
    new THREE.TorusGeometry(0.9, 0.01, 16, 80),
    new THREE.MeshBasicMaterial({ color: 0x56ccf2, transparent: true, opacity: 0.6 })
  );
  glow.position.set(0, 1.2, -1.2);
  glow.rotation.x = Math.PI / 2;
  scene.add(glow);

  const clock = new THREE.Clock();

  renderer.setAnimationLoop(() => {
    const elapsed = clock.getElapsedTime();
    launcher.rotation.y = Math.sin(elapsed * 0.5) * 0.2;
    glow.material.opacity = 0.6 + Math.sin(elapsed * 1.6) * 0.2;
    renderer.render(scene, camera);
  });

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

const apkButton = document.querySelector('[data-open="apk"]');
const configButton = document.querySelector('[data-open="config"]');
const apkPicker = document.getElementById("apk-picker");
const configPicker = document.getElementById("config-picker");

apkButton?.addEventListener("click", () => apkPicker?.click());
configButton?.addEventListener("click", () => configPicker?.click());

apkPicker?.addEventListener("change", () => {
  if (!apkPicker.files?.length) return;
  const file = apkPicker.files[0];
  console.info(`Selected APK: ${file.name}`);
});

configPicker?.addEventListener("change", async () => {
  if (!configPicker.files?.length) return;
  const file = configPicker.files[0];

  try {
    const text = await file.text();
    console.info("Loaded configuration:", JSON.parse(text));
  } catch (error) {
    console.warn("Unable to parse configuration file", error);
  }
});
