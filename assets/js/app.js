import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const COLS = 24;
const ROWS = 12;
const CELL_SIZE = 24;
const GRID_WIDTH = COLS * CELL_SIZE;
const GRID_HEIGHT = ROWS * CELL_SIZE;
const STORAGE_KEY = "auraDataMapping:v1";

const chakraData = [
  { name: "Root", color: "#ef4444", short: "R" },
  { name: "Sacral", color: "#f97316", short: "S" },
  { name: "Solar Plexus", color: "#eab308", short: "P" },
  { name: "Heart", color: "#22c55e", short: "H" },
  { name: "Throat", color: "#3b82f6", short: "T" },
  { name: "Third Eye", color: "#6366f1", short: "E" },
  { name: "Crown", color: "#8b5cf6", short: "C" }
];

const dataTypes = [
  { id: "website", label: "Living website", color: "#52d6c9" },
  { id: "document", label: "Document", color: "#f8d66d" },
  { id: "job", label: "Scheduled job", color: "#f59e0b" },
  { id: "repository", label: "Repository", color: "#93c5fd" },
  { id: "dataset", label: "Dataset", color: "#34d399" },
  { id: "prompt", label: "Prompt", color: "#c084fc" },
  { id: "contact", label: "Contact", color: "#fda4af" },
  { id: "other", label: "Other", color: "#cbd5e1" }
];

const typeLookup = Object.fromEntries(dataTypes.map((type) => [type.id, type]));

const els = {
  canvasContainer: document.getElementById("canvas-container"),
  viewSelect: document.getElementById("viewSelect"),
  cameraModeBtn: document.getElementById("cameraModeBtn"),
  focusBtn: document.getElementById("focusBtn"),
  saveBtn: document.getElementById("saveBtn"),
  layerRail: document.getElementById("layerRail"),
  activeLayerName: document.getElementById("activeLayerName"),
  selectedFacetLabel: document.getElementById("selectedFacetLabel"),
  mappedCount: document.getElementById("mappedCount"),
  shellCount: document.getElementById("shellCount"),
  legend: document.getElementById("legend"),
  inspectorTitle: document.getElementById("inspectorTitle"),
  openTargetBtn: document.getElementById("openTargetBtn"),
  mappingForm: document.getElementById("mappingForm"),
  titleInput: document.getElementById("titleInput"),
  typeInput: document.getElementById("typeInput"),
  targetInput: document.getElementById("targetInput"),
  statusInput: document.getElementById("statusInput"),
  cadenceInput: document.getElementById("cadenceInput"),
  tagsInput: document.getElementById("tagsInput"),
  notesInput: document.getElementById("notesInput"),
  saveMappingBtn: document.getElementById("saveMappingBtn"),
  deleteMappingBtn: document.getElementById("deleteMappingBtn"),
  filterInput: document.getElementById("filterInput"),
  searchInput: document.getElementById("searchInput"),
  mappingList: document.getElementById("mappingList"),
  mappedListCount: document.getElementById("mappedListCount"),
  exportBtn: document.getElementById("exportBtn"),
  importBtn: document.getElementById("importBtn"),
  resetLayerBtn: document.getElementById("resetLayerBtn"),
  importFile: document.getElementById("importFile")
};

let scene;
let camera;
let renderer;
let controls;
let raycaster;
let mouse;
let clock;
let hoverCell = null;
let cameraMoveMode = false;
let activeAnimation = null;

const auraLayers = [];

let appState = loadState();

function facetKey(layerIndex, shell, x, y) {
  return `${layerIndex}|${shell}|${x}|${y}`;
}

function newId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `facet-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function parseFacetKey(key) {
  const [layerIndex, shell, x, y] = key.split("|");
  return {
    layerIndex: Number(layerIndex),
    shell,
    x: Number(x),
    y: Number(y)
  };
}

function createSeedState() {
  const mappings = {};
  [
    {
      layerIndex: 3,
      shell: "outside",
      x: 4,
      y: 5,
      title: "GAJRA.Earth public field",
      type: "website",
      target: "https://GAJRA.Earth",
      status: "seed",
      cadence: "Live site",
      tags: "public, earth, community",
      notes: "Example outside/public mapping for a living website."
    },
    {
      layerIndex: 5,
      shell: "inside",
      x: 14,
      y: 4,
      title: "Aura construction notes",
      type: "document",
      target: "C:\\Users\\lukec\\Downloads\\Version7 Aura of Intelligence 2023 July.pdf",
      status: "seed",
      cadence: "Reference",
      tags: "private, source, aura",
      notes: "Example inside/private mapping for a document source."
    },
    {
      layerIndex: 0,
      shell: "outside",
      x: 18,
      y: 8,
      title: "Daily repo refresh",
      type: "job",
      target: "cron: 0 8 * * *",
      status: "seed",
      cadence: "Daily",
      tags: "automation, refresh",
      notes: "Example scheduled job record. Replace with the real automation when ready."
    },
    {
      layerIndex: 6,
      shell: "inside",
      x: 8,
      y: 2,
      title: "Values alignment reflection",
      type: "prompt",
      target: "prompt://values-alignment",
      status: "seed",
      cadence: "On demand",
      tags: "private, prompt",
      notes: "Example prompt mapping for a reflective private facet."
    }
  ].forEach((record) => {
    const key = facetKey(record.layerIndex, record.shell, record.x, record.y);
    mappings[key] = {
      id: newId(),
      updatedAt: new Date().toISOString(),
      ...record
    };
  });

  return {
    version: 1,
    activeLayer: 0,
    selectedKey: null,
    view: "flat",
    filter: "all",
    search: "",
    mappings
  };
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return createSeedState();
    const parsed = JSON.parse(saved);
    if (!parsed || !parsed.mappings) return createSeedState();
    return {
      ...createSeedState(),
      ...parsed,
      mappings: parsed.mappings
    };
  } catch (error) {
    console.warn("Could not load Aura Data Mapping state.", error);
    return createSeedState();
  }
}

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}

class AuraLayer {
  constructor(layer, index) {
    this.layer = layer;
    this.index = index;
    this.state = "flat";
    this.hasBeenFormed = false;

    const insideGeometry = new THREE.PlaneGeometry(GRID_WIDTH, GRID_HEIGHT, COLS, ROWS);
    const outsideGeometry = new THREE.PlaneGeometry(GRID_WIDTH, GRID_HEIGHT, COLS, ROWS);

    this.insidePlane = new THREE.Mesh(
      insideGeometry,
      new THREE.MeshBasicMaterial({ map: createGridTexture(index, "inside"), side: THREE.DoubleSide })
    );
    this.outsidePlane = new THREE.Mesh(
      outsideGeometry,
      new THREE.MeshBasicMaterial({ map: createGridTexture(index, "outside"), side: THREE.DoubleSide })
    );

    this.insidePlane.name = `inside_${index}`;
    this.outsidePlane.name = `outside_${index}`;
    this.insidePlane.userData = { layerIndex: index, shell: "inside" };
    this.outsidePlane.userData = { layerIndex: index, shell: "outside" };
    this.insidePlane.position.y = GRID_HEIGHT / 2 + 26;
    this.outsidePlane.position.y = -(GRID_HEIGHT / 2 + 26);

    this.initialPositions = {
      inside: this.insidePlane.geometry.attributes.position.array.slice(),
      outside: this.outsidePlane.geometry.attributes.position.array.slice()
    };
    this.torusPositions = { inside: null, outside: null };

    this.group = new THREE.Group();
    this.group.add(this.insidePlane, this.outsidePlane);
    this.group.visible = false;
    scene.add(this.group);
  }
}

function createGridTexture(layerIndex, shell, localHover = null) {
  const canvas = document.createElement("canvas");
  canvas.width = GRID_WIDTH;
  canvas.height = GRID_HEIGHT;
  const context = canvas.getContext("2d");
  const layer = chakraData[layerIndex];

  context.fillStyle = "#0b1020";
  context.fillRect(0, 0, canvas.width, canvas.height);

  const records = Object.entries(appState.mappings)
    .filter(([, record]) => record.layerIndex === layerIndex && record.shell === shell);

  records.forEach(([key, record]) => {
    const type = typeLookup[record.type] || typeLookup.other;
    const fillX = record.x * CELL_SIZE;
    const fillY = record.y * CELL_SIZE;
    context.fillStyle = hexToRgba(type.color, 0.78);
    context.fillRect(fillX, fillY, CELL_SIZE, CELL_SIZE);
    context.fillStyle = hexToRgba(layer.color, 0.34);
    context.fillRect(fillX + 4, fillY + 4, CELL_SIZE - 8, CELL_SIZE - 8);

    if (key === appState.selectedKey) {
      context.strokeStyle = "#ffffff";
      context.lineWidth = 4;
      context.strokeRect(fillX + 2, fillY + 2, CELL_SIZE - 4, CELL_SIZE - 4);
    }
  });

  if (localHover) {
    context.fillStyle = hexToRgba(layer.color, 0.22);
    context.fillRect(localHover.x * CELL_SIZE, localHover.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    context.strokeStyle = hexToRgba("#ffffff", 0.82);
    context.lineWidth = 3;
    context.strokeRect(localHover.x * CELL_SIZE + 1, localHover.y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
  }

  context.strokeStyle = "rgba(148, 163, 184, 0.42)";
  context.lineWidth = 1;
  for (let row = 0; row <= ROWS; row += 1) {
    context.beginPath();
    context.moveTo(0, row * CELL_SIZE);
    context.lineTo(GRID_WIDTH, row * CELL_SIZE);
    context.stroke();
  }
  for (let col = 0; col <= COLS; col += 1) {
    context.beginPath();
    context.moveTo(col * CELL_SIZE, 0);
    context.lineTo(col * CELL_SIZE, GRID_HEIGHT);
    context.stroke();
  }

  context.fillStyle = hexToRgba("#ffffff", 0.14);
  context.font = "800 34px Inter, Arial, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(`${shell.toUpperCase()} ${shell === "inside" ? "PRIVATE" : "PUBLIC"}`, GRID_WIDTH / 2, GRID_HEIGHT / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = renderer?.capabilities?.getMaxAnisotropy?.() || 1;
  return texture;
}

function updateLayerTextures(layerIndex = appState.activeLayer) {
  const layer = auraLayers[layerIndex];
  if (!layer) return;
  const insideHover = hoverCell?.layerIndex === layerIndex && hoverCell.shell === "inside" ? hoverCell : null;
  const outsideHover = hoverCell?.layerIndex === layerIndex && hoverCell.shell === "outside" ? hoverCell : null;
  replaceTexture(layer.insidePlane, createGridTexture(layerIndex, "inside", insideHover));
  replaceTexture(layer.outsidePlane, createGridTexture(layerIndex, "outside", outsideHover));
}

function replaceTexture(plane, texture) {
  if (plane.material.map) plane.material.map.dispose();
  plane.material.map = texture;
  plane.material.needsUpdate = true;
}

function hexToRgba(hex, alpha) {
  const clean = hex.replace("#", "");
  const value = Number.parseInt(clean, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function initScene() {
  scene = new THREE.Scene();
  clock = new THREE.Clock();
  camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 5000);
  camera.position.set(0, 0, 650);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  els.canvasContainer.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.enableRotate = false;
  controls.enableZoom = true;

  const topSphere = new THREE.Mesh(
    new THREE.IcosahedronGeometry(GRID_WIDTH * 1.24, 3),
    new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.055 })
  );
  topSphere.position.y = GRID_HEIGHT * 1.7;
  scene.add(topSphere);

  const bottomSphere = topSphere.clone();
  bottomSphere.position.y = -GRID_HEIGHT * 1.7;
  scene.add(bottomSphere);

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  chakraData.forEach((layer, index) => auraLayers[index] = new AuraLayer(layer, index));
  switchLayer(appState.activeLayer);

  window.addEventListener("resize", onResize);
  renderer.domElement.addEventListener("pointerdown", onPointerDown);
  renderer.domElement.addEventListener("pointermove", onPointerMove);
  renderer.domElement.addEventListener("pointerleave", () => {
    hoverCell = null;
    updateLayerTextures();
  });
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

function initUI() {
  dataTypes.forEach((type) => {
    const typeOption = new Option(type.label, type.id);
    els.typeInput.add(typeOption);
    els.filterInput.add(new Option(type.label, type.id));

    const legendItem = document.createElement("div");
    legendItem.className = "legend-item";
    legendItem.innerHTML = `<span class="legend-swatch" style="--item-color:${type.color}"></span>${type.label}`;
    els.legend.appendChild(legendItem);
  });

  [...chakraData.entries()].reverse().forEach(([index, layer]) => {
    const button = document.createElement("button");
    button.className = "layer-btn";
    button.type = "button";
    button.textContent = layer.short;
    button.title = layer.name;
    button.style.setProperty("--layer-color", layer.color);
    button.dataset.layer = String(index);
    button.addEventListener("click", () => switchLayer(index));
    els.layerRail.appendChild(button);
  });

  els.viewSelect.value = appState.view;
  els.filterInput.value = appState.filter;
  els.searchInput.value = appState.search;

  els.viewSelect.addEventListener("change", () => setView(els.viewSelect.value));
  els.cameraModeBtn.addEventListener("click", toggleCameraMode);
  els.focusBtn.addEventListener("click", refocusCamera);
  els.saveBtn.addEventListener("click", () => {
    persistState();
    flashButton(els.saveBtn, "Saved");
  });
  els.mappingForm.addEventListener("submit", saveSelectedMapping);
  els.deleteMappingBtn.addEventListener("click", deleteSelectedMapping);
  els.openTargetBtn.addEventListener("click", openSelectedTarget);
  els.filterInput.addEventListener("change", () => {
    appState.filter = els.filterInput.value;
    persistState();
    renderMappingList();
  });
  els.searchInput.addEventListener("input", () => {
    appState.search = els.searchInput.value;
    persistState();
    renderMappingList();
  });
  els.exportBtn.addEventListener("click", exportMappings);
  els.importBtn.addEventListener("click", () => els.importFile.click());
  els.importFile.addEventListener("change", importMappings);
  els.resetLayerBtn.addEventListener("click", clearActiveLayer);

  renderAll();
}

function switchLayer(index) {
  appState.activeLayer = index;
  if (appState.selectedKey && parseFacetKey(appState.selectedKey).layerIndex !== index) {
    appState.selectedKey = null;
  }
  auraLayers.forEach((layer) => {
    if (layer) layer.group.visible = false;
  });

  const layer = auraLayers[index];
  layer.group.visible = true;
  if (appState.view === "torus") {
    if (layer.hasBeenFormed) {
      applyTorusView(layer);
    } else {
      formTorus(layer);
    }
  }
  persistState();
  renderAll();
}

function setView(view) {
  appState.view = view;
  els.viewSelect.value = view;
  const layer = auraLayers[appState.activeLayer];
  if (!layer) return;
  if (view === "torus") {
    if (layer.hasBeenFormed) applyTorusView(layer);
    else formTorus(layer);
  } else {
    applyFlatView(layer);
  }
  persistState();
  renderAll();
}

function formTorus(layer) {
  if (activeAnimation || layer.state === "animating") return;
  layer.state = "animating";
  activeAnimation = layer.index;
  const sandwichDuration = 0.8;
  const insideStart = layer.insidePlane.position.clone();
  const outsideStart = layer.outsidePlane.position.clone();
  let elapsedTime = 0;

  const sandwichLoop = () => {
    elapsedTime += clock.getDelta();
    const progress = Math.min(elapsedTime / sandwichDuration, 1);
    layer.insidePlane.position.lerpVectors(insideStart, new THREE.Vector3(0, 0.5, 0), progress);
    layer.outsidePlane.position.lerpVectors(outsideStart, new THREE.Vector3(0, -0.5, 0), progress);
    if (progress < 1) requestAnimationFrame(sandwichLoop);
    else rollTorus(layer);
  };
  sandwichLoop();
}

function rollTorus(layer) {
  const duration = 1.2;
  const radius = GRID_HEIGHT / (2 * Math.PI);
  const posIn = layer.insidePlane.geometry.attributes.position;
  const posOut = layer.outsidePlane.geometry.attributes.position;
  const initIn = layer.initialPositions.inside;
  const initOut = layer.initialPositions.outside;
  let elapsedTime = 0;

  const rollLoop = () => {
    elapsedTime += clock.getDelta();
    const progress = Math.min(elapsedTime / duration, 1);
    morphRoll(posIn, initIn, radius, -0.5, progress);
    morphRoll(posOut, initOut, radius, 0.5, progress);
    if (progress < 1) requestAnimationFrame(rollLoop);
    else bendTorus(layer);
  };
  rollLoop();
}

function morphRoll(positionAttribute, initialPosition, radius, offset, progress) {
  for (let i = 0; i < positionAttribute.count; i += 1) {
    const y = initialPosition[i * 3 + 1];
    const angle = (y / GRID_HEIGHT) * 2 * Math.PI;
    const targetY = Math.cos(angle) * (radius + offset);
    const targetZ = Math.sin(angle) * (radius + offset);
    positionAttribute.setY(i, y + (targetY - y) * progress);
    positionAttribute.setZ(i, targetZ * progress);
  }
  positionAttribute.needsUpdate = true;
}

function bendTorus(layer) {
  const duration = 1.5;
  const tubeRadius = GRID_HEIGHT / (2 * Math.PI);
  const torusRadius = tubeRadius;
  const posIn = layer.insidePlane.geometry.attributes.position;
  const posOut = layer.outsidePlane.geometry.attributes.position;
  const cylIn = posIn.array.slice();
  const cylOut = posOut.array.slice();
  let elapsedTime = 0;

  const bendLoop = () => {
    elapsedTime += clock.getDelta();
    const progress = Math.min(elapsedTime / duration, 1);
    morphBend(posIn, cylIn, torusRadius, tubeRadius, -0.5, progress);
    morphBend(posOut, cylOut, torusRadius, tubeRadius, 0.5, progress);
    if (progress < 1) {
      requestAnimationFrame(bendLoop);
    } else {
      layer.state = "torus";
      layer.hasBeenFormed = true;
      layer.torusPositions.inside = layer.insidePlane.geometry.attributes.position.array.slice();
      layer.torusPositions.outside = layer.outsidePlane.geometry.attributes.position.array.slice();
      activeAnimation = null;
      renderAll();
    }
  };
  bendLoop();
}

function morphBend(positionAttribute, cylinderPosition, torusRadius, tubeRadius, offset, progress) {
  for (let i = 0; i < positionAttribute.count; i += 1) {
    const cylX = cylinderPosition[i * 3];
    const cylY = cylinderPosition[i * 3 + 1];
    const cylZ = cylinderPosition[i * 3 + 2];
    const mainAngle = (cylX / GRID_WIDTH) * 2 * Math.PI;
    const tubeAngle = Math.atan2(cylZ, cylY);
    const r = tubeRadius + offset;
    const targetX = (torusRadius + r * Math.cos(tubeAngle)) * Math.cos(mainAngle);
    const targetY = r * Math.sin(tubeAngle);
    const targetZ = (torusRadius + r * Math.cos(tubeAngle)) * Math.sin(mainAngle);
    positionAttribute.setX(i, cylX + (targetX - cylX) * progress);
    positionAttribute.setY(i, cylY + (targetY - cylY) * progress);
    positionAttribute.setZ(i, cylZ + (targetZ - cylZ) * progress);
  }
  positionAttribute.needsUpdate = true;
}

function applyTorusView(layer) {
  if (!layer.torusPositions.inside || !layer.torusPositions.outside) return;
  layer.insidePlane.geometry.attributes.position.copyArray(layer.torusPositions.inside);
  layer.outsidePlane.geometry.attributes.position.copyArray(layer.torusPositions.outside);
  layer.insidePlane.position.set(0, 0, 0);
  layer.outsidePlane.position.set(0, 0, 0);
  layer.insidePlane.geometry.attributes.position.needsUpdate = true;
  layer.outsidePlane.geometry.attributes.position.needsUpdate = true;
  layer.state = "torus";
}

function applyFlatView(layer) {
  layer.insidePlane.geometry.attributes.position.copyArray(layer.initialPositions.inside);
  layer.outsidePlane.geometry.attributes.position.copyArray(layer.initialPositions.outside);
  layer.insidePlane.position.set(0, GRID_HEIGHT / 2 + 26, 0);
  layer.outsidePlane.position.set(0, -(GRID_HEIGHT / 2 + 26), 0);
  layer.insidePlane.geometry.attributes.position.needsUpdate = true;
  layer.outsidePlane.geometry.attributes.position.needsUpdate = true;
  layer.state = "flat";
}

function getIntersectedCell(event) {
  const layer = auraLayers[appState.activeLayer];
  if (!layer || !layer.group.visible) return null;

  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects([layer.insidePlane, layer.outsidePlane]);
  if (!intersects.length) return null;
  const intersect = intersects[0];
  const uv = intersect.uv;
  const x = Math.min(COLS - 1, Math.max(0, Math.floor(uv.x * COLS)));
  const y = Math.min(ROWS - 1, Math.max(0, ROWS - 1 - Math.floor(uv.y * ROWS)));
  return {
    layerIndex: appState.activeLayer,
    shell: intersect.object.userData.shell,
    plane: intersect.object,
    x,
    y
  };
}

function onPointerDown(event) {
  if (cameraMoveMode) return;
  const cell = getIntersectedCell(event);
  if (!cell) return;
  appState.selectedKey = facetKey(cell.layerIndex, cell.shell, cell.x, cell.y);
  persistState();
  updateLayerTextures(cell.layerIndex);
  renderAll();
}

function onPointerMove(event) {
  if (cameraMoveMode) return;
  const nextHover = getIntersectedCell(event);
  const nextKey = nextHover ? facetKey(nextHover.layerIndex, nextHover.shell, nextHover.x, nextHover.y) : null;
  const currentKey = hoverCell ? facetKey(hoverCell.layerIndex, hoverCell.shell, hoverCell.x, hoverCell.y) : null;
  if (nextKey === currentKey) return;
  hoverCell = nextHover;
  updateLayerTextures();
}

function toggleCameraMode() {
  cameraMoveMode = !cameraMoveMode;
  controls.enablePan = cameraMoveMode;
  controls.enableRotate = cameraMoveMode;
  els.canvasContainer.querySelector("canvas").style.cursor = cameraMoveMode ? "grab" : "crosshair";
  els.cameraModeBtn.textContent = cameraMoveMode ? "Select facets" : "Move camera";
}

function refocusCamera() {
  camera.position.set(0, 0, appState.view === "torus" ? 430 : 650);
  controls.target.set(0, 0, 0);
  controls.update();
}

function selectedRecord() {
  return appState.selectedKey ? appState.mappings[appState.selectedKey] : null;
}

function selectedCellInfo() {
  return appState.selectedKey ? parseFacetKey(appState.selectedKey) : null;
}

function renderAll() {
  renderLayerRail();
  renderStatus();
  renderForm();
  renderMappingList();
  updateLayerTextures(appState.activeLayer);
}

function renderLayerRail() {
  els.layerRail.querySelectorAll(".layer-btn").forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.layer) === appState.activeLayer);
  });
}

function renderStatus() {
  const layer = chakraData[appState.activeLayer];
  const selected = selectedCellInfo();
  const records = Object.values(appState.mappings);
  const activeRecords = records.filter((record) => record.layerIndex === appState.activeLayer);
  const inside = activeRecords.filter((record) => record.shell === "inside").length;
  const outside = activeRecords.filter((record) => record.shell === "outside").length;

  els.activeLayerName.textContent = layer.name;
  els.activeLayerName.style.color = layer.color;
  els.mappedCount.textContent = String(activeRecords.length);
  els.shellCount.textContent = `${inside} / ${outside}`;
  els.selectedFacetLabel.textContent = selected
    ? `${chakraData[selected.layerIndex].name} ${selected.shell} ${selected.x + 1}, ${selected.y + 1}`
    : "None selected";
}

function renderForm() {
  const cell = selectedCellInfo();
  const record = selectedRecord();
  const canEdit = Boolean(cell);
  const title = cell
    ? `${chakraData[cell.layerIndex].name} ${cell.shell} facet ${cell.x + 1}:${cell.y + 1}`
    : "Choose a square";

  els.inspectorTitle.textContent = record?.title || title;
  els.titleInput.value = record?.title || "";
  els.typeInput.value = record?.type || "website";
  els.targetInput.value = record?.target || "";
  els.statusInput.value = record?.status || "seed";
  els.cadenceInput.value = record?.cadence || "";
  els.tagsInput.value = record?.tags || "";
  els.notesInput.value = record?.notes || "";
  els.saveMappingBtn.disabled = !canEdit;
  els.deleteMappingBtn.disabled = !record;
  els.openTargetBtn.disabled = !record?.target;
}

function saveSelectedMapping(event) {
  event.preventDefault();
  const cell = selectedCellInfo();
  if (!cell) return;

  const existing = selectedRecord();
  const title = els.titleInput.value.trim() || `${chakraData[cell.layerIndex].name} ${cell.shell} facet ${cell.x + 1}:${cell.y + 1}`;
  appState.mappings[appState.selectedKey] = {
    id: existing?.id || newId(),
    layerIndex: cell.layerIndex,
    shell: cell.shell,
    x: cell.x,
    y: cell.y,
    title,
    type: els.typeInput.value,
    target: els.targetInput.value.trim(),
    status: els.statusInput.value,
    cadence: els.cadenceInput.value.trim(),
    tags: els.tagsInput.value.trim(),
    notes: els.notesInput.value.trim(),
    updatedAt: new Date().toISOString()
  };

  persistState();
  updateLayerTextures(cell.layerIndex);
  renderAll();
  flashButton(els.saveMappingBtn, "Saved");
}

function deleteSelectedMapping() {
  if (!appState.selectedKey || !appState.mappings[appState.selectedKey]) return;
  const cell = selectedCellInfo();
  delete appState.mappings[appState.selectedKey];
  persistState();
  updateLayerTextures(cell.layerIndex);
  renderAll();
}

function openSelectedTarget() {
  const record = selectedRecord();
  if (!record?.target) return;
  if (/^https?:\/\//i.test(record.target)) {
    window.open(record.target, "_blank", "noopener");
    return;
  }
  navigator.clipboard?.writeText(record.target);
  flashButton(els.openTargetBtn, "Copied");
}

function renderMappingList() {
  const query = appState.search.trim().toLowerCase();
  const records = Object.entries(appState.mappings)
    .filter(([, record]) => record.layerIndex === appState.activeLayer)
    .filter(([, record]) => appState.filter === "all" || record.type === appState.filter)
    .filter(([, record]) => {
      if (!query) return true;
      return [record.title, record.target, record.tags, record.notes, record.status, record.cadence]
        .join(" ")
        .toLowerCase()
        .includes(query);
    })
    .sort(([, a], [, b]) => a.shell.localeCompare(b.shell) || a.y - b.y || a.x - b.x);

  if (!records.length) {
    els.mappedListCount.textContent = "0";
    els.mappingList.innerHTML = '<div class="empty-state">No mapped facets on this layer yet.</div>';
    return;
  }

  els.mappedListCount.textContent = String(records.length);
  els.mappingList.innerHTML = "";
  records.forEach(([key, record]) => {
    const type = typeLookup[record.type] || typeLookup.other;
    const button = document.createElement("button");
    button.className = "mapping-card";
    button.type = "button";
    button.style.setProperty("--item-color", type.color);
    button.classList.toggle("active", key === appState.selectedKey);
    button.innerHTML = `
      <span class="mapping-card-title">
        <span>${escapeHtml(record.title)}</span>
        <span>${record.x + 1}:${record.y + 1}</span>
      </span>
      <span class="mapping-meta">
        <span>${type.label}</span>
        <span>${record.shell}</span>
        <span>${record.status}</span>
      </span>
    `;
    button.addEventListener("click", () => {
      appState.selectedKey = key;
      persistState();
      updateLayerTextures(appState.activeLayer);
      renderAll();
    });
    els.mappingList.appendChild(button);
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function exportMappings() {
  const exportData = {
    ...appState,
    exportedAt: new Date().toISOString(),
    source: "aura-data-mapping"
  };
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "aura-data-mapping.json";
  anchor.click();
  URL.revokeObjectURL(url);
}

function importMappings(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      if (!parsed.mappings || typeof parsed.mappings !== "object") {
        throw new Error("Missing mappings object.");
      }
      appState = {
        ...appState,
        ...parsed,
        activeLayer: Number(parsed.activeLayer || 0),
        mappings: parsed.mappings
      };
      persistState();
      renderAll();
    } catch (error) {
      alert(`Could not import this JSON: ${error.message}`);
    } finally {
      els.importFile.value = "";
    }
  };
  reader.readAsText(file);
}

function clearActiveLayer() {
  const layerName = chakraData[appState.activeLayer].name;
  const ok = confirm(`Clear all mapped facets from the ${layerName} layer?`);
  if (!ok) return;
  Object.keys(appState.mappings).forEach((key) => {
    if (appState.mappings[key].layerIndex === appState.activeLayer) {
      delete appState.mappings[key];
    }
  });
  if (appState.selectedKey) {
    const selected = parseFacetKey(appState.selectedKey);
    if (selected.layerIndex === appState.activeLayer) appState.selectedKey = null;
  }
  persistState();
  renderAll();
}

function flashButton(button, label) {
  const original = button.textContent;
  button.textContent = label;
  window.setTimeout(() => {
    button.textContent = original;
  }, 1100);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

initUI();
initScene();
animate();
