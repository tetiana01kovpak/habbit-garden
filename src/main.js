import * as THREE from 'three';
import { getHabits, addHabit, completeHabit, deleteHabit, isDoneToday } from './store.js';
import { createPlant } from './plant.js';

const canvas = document.getElementById('garden');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x7ec8e3);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x7ec8e3, 0.025);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 5, 10);
camera.lookAt(0, 1, 0);

scene.add(new THREE.HemisphereLight(0xaaddff, 0x556633, 1.2));

const sun = new THREE.DirectionalLight(0xfff0dd, 2.5);
sun.position.set(4, 10, 6);
scene.add(sun);

const backLight = new THREE.DirectionalLight(0x88bbff, 1.0);
backLight.position.set(-6, 8, -4);
scene.add(backLight);

const warmFill = new THREE.PointLight(0xffaa66, 1.2, 20);
warmFill.position.set(4, 3, 4);
scene.add(warmFill);

const coolFill = new THREE.PointLight(0x66aaff, 0.8, 20);
coolFill.position.set(-4, 3, -4);
scene.add(coolFill);

const gardenGlow = new THREE.PointLight(0xa8e6cf, 0.6, 15);
gardenGlow.position.set(0, 1, 0);
scene.add(gardenGlow);

const rimLight = new THREE.SpotLight(0xffeebb, 1.5, 25, Math.PI / 5, 0.4);
rimLight.position.set(-4, 10, 8);
rimLight.target.position.set(0, 0, 0);
scene.add(rimLight);
scene.add(rimLight.target);

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(10, 8),
  new THREE.MeshStandardMaterial({ color: 0x3d5a3a, flatShading: true, roughness: 0.85, metalness: 0.02 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.2;
scene.add(ground);

const skyGeo = new THREE.IcosahedronGeometry(40, 2);
const skyMat = new THREE.MeshBasicMaterial({ color: 0x88ccee, side: THREE.BackSide, flatShading: true });
const sky = new THREE.Mesh(skyGeo, skyMat);
scene.add(sky);

const sunGeo = new THREE.IcosahedronGeometry(2, 1);
const sunMat = new THREE.MeshBasicMaterial({ color: 0xffee88, flatShading: true });
const sunMesh = new THREE.Mesh(sunGeo, sunMat);
sunMesh.position.set(15, 20, -10);
scene.add(sunMesh);

const sunGlowGeo = new THREE.IcosahedronGeometry(3, 1);
const sunGlowMat = new THREE.MeshBasicMaterial({ color: 0xfffacc, transparent: true, opacity: 0.3, flatShading: true });
const sunGlow = new THREE.Mesh(sunGlowGeo, sunGlowMat);
sunGlow.position.copy(sunMesh.position);
scene.add(sunGlow);

function createCloud(x, y, z, scale) {
  const group = new THREE.Group();
  const cloudMat = new THREE.MeshBasicMaterial({
    color: 0xffffff, flatShading: true, transparent: true, opacity: 0.8,
  });
  const blobCount = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < blobCount; i++) {
    const r = 0.8 + Math.random() * 1.0;
    const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), cloudMat);
    blob.position.set((i - blobCount / 2) * 1.1, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.6);
    blob.scale.set(1.2, 0.45 + Math.random() * 0.25, 0.9);
    group.add(blob);
  }
  group.position.set(x, y, z);
  group.scale.setScalar(scale);
  return group;
}

const clouds = [
  createCloud(-12, 4.5, -8, 1.4),
  createCloud(10, 5, -10, 1.6),
  createCloud(20, 4, -6, 1.1),
  createCloud(-18, 5.5, -12, 1.2),
  createCloud(2, 6, -15, 1.5),
  createCloud(-7, 4, -5, 1.0),
  createCloud(15, 4.5, -14, 1.3),
];
clouds.forEach(c => scene.add(c));

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let plants = [];
let selectedHabitId = null;
let orbitAngle = 0;

function layoutPosition(index, total) {
  if (total <= 1) return new THREE.Vector3(0, 0, 0);
  const radius = 1.5 + total * 0.3;
  const angle = (index / total) * Math.PI * 2;
  return new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
}

function rebuildScene() {
  plants.forEach(p => scene.remove(p));
  plants = [];
  const habits = getHabits();
  habits.forEach((habit, i) => {
    const plant = createPlant(habit);
    plant.position.copy(layoutPosition(i, habits.length));
    scene.add(plant);
    plants.push(plant);
  });
  renderHabitList();
}

function renderHabitList() {
  const list = document.getElementById('habit-list');
  list.innerHTML = '';
  getHabits().forEach(habit => {
    const done = isDoneToday(habit);
    const el = document.createElement('div');
    el.className = 'habit-item' + (done ? ' habit-done' : '');
    el.innerHTML = `<span class="habit-dot" style="background:${done ? '#a8e6cf' : '#555'}"></span><span>${habit.name}</span>`;
    el.addEventListener('click', () => showDetail(habit.id));
    list.appendChild(el);
  });
}

function showDetail(id) {
  const habit = getHabits().find(h => h.id === id);
  if (!habit) return;
  selectedHabitId = id;
  document.getElementById('detail-name').textContent = habit.name;
  document.getElementById('detail-streak').textContent = `Streak: ${habit.streakCount} days`;
  document.getElementById('detail-total').textContent = `Total: ${habit.totalCompletions} completions`;
  document.getElementById('detail').classList.remove('hidden');
  const btn = document.getElementById('detail-done');
  btn.textContent = 'Done today';
  btn.disabled = false;
}

document.getElementById('add-form').addEventListener('submit', e => {
  e.preventDefault();
  const input = document.getElementById('habit-input');
  if (!input.value.trim()) return;
  addHabit(input.value.trim());
  input.value = '';
  rebuildScene();
});

document.getElementById('detail-done').addEventListener('click', () => {
  if (!selectedHabitId) return;
  completeHabit(selectedHabitId);
  rebuildScene();
  showDetail(selectedHabitId);
});

document.getElementById('detail-close').addEventListener('click', () => {
  document.getElementById('detail').classList.add('hidden');
  selectedHabitId = null;
});

document.getElementById('detail-delete').addEventListener('click', () => {
  if (!selectedHabitId) return;
  deleteHabit(selectedHabitId);
  document.getElementById('detail').classList.add('hidden');
  selectedHabitId = null;
  rebuildScene();
});

canvas.addEventListener('click', e => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hit = raycaster.intersectObjects(plants, true);
  if (hit.length) {
    let obj = hit[0].object;
    while (obj.parent && !obj.userData.habitId) obj = obj.parent;
    if (obj.userData.habitId) showDetail(obj.userData.habitId);
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  requestAnimationFrame(animate);
  orbitAngle += 0.0008;
  camera.position.set(Math.sin(orbitAngle) * 9, 4.5 + Math.sin(orbitAngle * 0.5) * 0.5, Math.cos(orbitAngle) * 9);
  camera.lookAt(0, 1, 0);

  const t = Date.now() * 0.001;
  plants.forEach((p, i) => {
    p.rotation.y = Math.sin(t + i * 1.5) * 0.015;
    p.children.forEach((c, j) => {
      if (j > 0) c.rotation.z += Math.sin(t * 0.8 + j * 0.7) * 0.0003;
    });
  });

  gardenGlow.intensity = 0.3 + Math.sin(t * 0.5) * 0.05;

  clouds.forEach((c, i) => {
    c.position.x += 0.003 * (0.8 + i * 0.1);
    if (c.position.x > 22) c.position.x = -22;
  });

  renderer.render(scene, camera);
}

rebuildScene();
animate();
