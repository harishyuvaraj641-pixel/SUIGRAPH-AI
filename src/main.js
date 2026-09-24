import * as THREE from 'three';
import { World } from './world.js';
import { NETWORK_DATA, PipelineNetwork } from './network.js';
import { SensorManager } from './sensors.js';
import { FlowSystem, LeakEffect } from './effects.js';
import { AISystem } from './ai.js';
import { DemoMode } from './demo.js';

// ═══════════════════════════════════════════════════════════
//  SuiGraph AI — 3D Pipeline Digital Twin
//  Main Application Bootstrap & Interaction Controller
// ═══════════════════════════════════════════════════════════

class App {
  constructor() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoveredObject = null;
    this.selectedObject = null;
    this.graphMode = false;
    this.sensorMode = false;

    this.init();
  }

  async init() {
    const container = document.getElementById('canvas-container');

    // ── Core Systems ──
    this.world = new World(container);
    this.network = new PipelineNetwork(this.world.scene);
    this.sensors = new SensorManager(this.world.scene, NETWORK_DATA, this.network);
    this.flow = new FlowSystem(this.world.scene, this.network);
    this.leak = new LeakEffect(this.world.scene);
    this.ai = new AISystem(this.world.scene, this.network, this.sensors);

    // ── UI Callbacks ──
    this.ui = {
      showDemoText: (text, subtext) => this._showDemoText(text, subtext),
      hideDemoText: () => this._hideDemoText(),
      updateAIPanel: (model, status, score, gnn) => this._updateAIPanel(model, status, score, gnn),
      updateLeakPanel: (show, pipe, conf, loss, status) => this._updateLeakPanel(show, pipe, conf, loss, status),
      updateTopBar: (health, anomalyCount) => this._updateTopBar(health, anomalyCount),
      setControlActive: (action) => this._setControlActive(action),
      showWorkOrder: () => this._showWorkOrder(),
    };

    // ── Demo Mode ──
    this.demo = new DemoMode({
      world: this.world,
      network: this.network,
      sensors: this.sensors,
      flow: this.flow,
      leak: this.leak,
      ai: this.ai,
      ui: this.ui,
    });

    // ── Event Listeners ──
    this._setupEvents(container);

    // ── Start Render Loop ──
    this._animate();

    // ── Hide Loading Screen ──
    setTimeout(() => {
      const loading = document.getElementById('loading');
      if (loading) loading.classList.add('hidden');
    }, 1500);

    // ── Start sync timer ──
    this._startSyncTimer();
  }

  // ═══════════════════════════════════════
  //  EVENT HANDLING
  // ═══════════════════════════════════════

  _setupEvents(container) {
    // Mouse move for hover / tooltip
    container.addEventListener('mousemove', (e) => this._onMouseMove(e), false);

    // Click for selection
    container.addEventListener('click', (e) => this._onClick(e), false);

    // Control buttons
    document.querySelectorAll('.ctrl-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        this._handleControl(action);
      });
    });

    // Detail panel close
    const closeBtn = document.getElementById('detail-close');
    if (closeBtn) closeBtn.addEventListener('click', () => this._closeDetailPanel());

    // Work order modal close
    const woClose = document.getElementById('wo-close');
    if (woClose) woClose.addEventListener('click', () => {
      document.getElementById('work-order-modal').classList.remove('visible');
    });
  }

  _onMouseMove(e) {
    const rect = this.world.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    // Raycast
    this.raycaster.setFromCamera(this.mouse, this.world.camera);
    const allTargets = [
      ...this.network.getAllInteractables(),
      ...this.sensors.getAllInteractables(),
    ];
    const intersects = this.raycaster.intersectObjects(allTargets, false);

    const tooltip = document.getElementById('tooltip');

    if (intersects.length > 0) {
      const obj = intersects[0].object;
      const ud = obj.userData;

      if (ud && ud.type) {
        // Restore previous hover
        if (this.hoveredObject && this.hoveredObject !== obj) {
          this._unhover(this.hoveredObject);
        }
        this.hoveredObject = obj;
        this._hover(obj);

        // Show tooltip
        this._showTooltip(e.clientX, e.clientY, ud);
        document.body.style.cursor = 'pointer';
      }
    } else {
      if (this.hoveredObject) {
        this._unhover(this.hoveredObject);
        this.hoveredObject = null;
      }
      tooltip.classList.remove('visible');
      document.body.style.cursor = 'default';
    }
  }

  _hover(obj) {
    if (obj.material && obj.material.emissiveIntensity !== undefined) {
      obj._origEmissiveIntensity = obj._origEmissiveIntensity ?? obj.material.emissiveIntensity;
      obj.material.emissiveIntensity = Math.min(obj._origEmissiveIntensity + 0.4, 1.0);
    }
  }

  _unhover(obj) {
    if (obj.material && obj._origEmissiveIntensity !== undefined) {
      obj.material.emissiveIntensity = obj._origEmissiveIntensity;
      delete obj._origEmissiveIntensity;
    }
  }

  _showTooltip(x, y, userData) {
    const tooltip = document.getElementById('tooltip');
    const title = document.getElementById('tt-title');
    const body = document.getElementById('tt-body');

    let titleText = '';
    let bodyHtml = '';

    switch (userData.type) {
      case 'pipe': {
        const pipeEntry = this.network.pipes.get(userData.id);
        const d = pipeEntry?.data;
        titleText = `PIPE ${userData.id}`;
        if (d) {
          bodyHtml = `
            <div class="tt-row"><span class="tt-label">PRESSURE</span><span class="tt-value">${d.pressure} bar</span></div>
            <div class="tt-row"><span class="tt-label">FLOW</span><span class="tt-value">${d.flow} L/min</span></div>
            <div class="tt-row"><span class="tt-label">HEALTH</span><span class="tt-value" style="color:${d.health === 'CRITICAL' ? '#ff3344' : '#00ff88'}">${d.health}</span></div>
            <div class="tt-row"><span class="tt-label">CONFIDENCE</span><span class="tt-value">${(d.leakConfidence * 100).toFixed(1)}%</span></div>
          `;
        }
        break;
      }
      case 'sensor': {
        const sensor = this.sensors.getSensor(userData.id);
        const sd = sensor?.data;
        titleText = `SENSOR ${userData.id}`;
        if (sd) {
          bodyHtml = `
            <div class="tt-row"><span class="tt-label">TYPE</span><span class="tt-value">${sd.type.toUpperCase()}</span></div>
            <div class="tt-row"><span class="tt-label">CURRENT</span><span class="tt-value">${sd.currentValue} ${sd.unit}</span></div>
            <div class="tt-row"><span class="tt-label">NORMAL</span><span class="tt-value">${sd.normalValue} ${sd.unit}</span></div>
            <div class="tt-row"><span class="tt-label">STATUS</span><span class="tt-value" style="color:${sensor.state === 'CRITICAL' ? '#ff3344' : '#00ff88'}">${sensor.state}</span></div>
          `;
        }
        break;
      }
      case 'valve': {
        titleText = `VALVE ${userData.id}`;
        bodyHtml = `
          <div class="tt-row"><span class="tt-label">STATUS</span><span class="tt-value" style="color:#00ff88">OPEN</span></div>
          <div class="tt-row"><span class="tt-label">OPEN</span><span class="tt-value">${userData.openPct ?? 100}%</span></div>
        `;
        break;
      }
      case 'pump': {
        titleText = `${userData.id}`;
        bodyHtml = `
          <div class="tt-row"><span class="tt-label">FLOW</span><span class="tt-value">${userData.flow ?? 420} L/min</span></div>
          <div class="tt-row"><span class="tt-label">STATUS</span><span class="tt-value" style="color:#00ff88">${userData.status ?? 'ONLINE'}</span></div>
        `;
        break;
      }
      case 'tank': {
        titleText = `${userData.id}`;
        bodyHtml = `
          <div class="tt-row"><span class="tt-label">LEVEL</span><span class="tt-value">${userData.level ?? 78}%</span></div>
        `;
        break;
      }
      case 'junction': {
        titleText = `JUNCTION ${userData.id}`;
        bodyHtml = `<div class="tt-row"><span class="tt-label">NODE</span><span class="tt-value">ACTIVE</span></div>`;
        break;
      }
    }

    title.textContent = titleText;
    body.innerHTML = bodyHtml;
    tooltip.classList.add('visible');

    // Position tooltip near cursor
    const pad = 16;
    tooltip.style.left = (x + pad) + 'px';
    tooltip.style.top = (y + pad) + 'px';

    // Prevent overflow
    const tr = tooltip.getBoundingClientRect();
    if (tr.right > window.innerWidth) tooltip.style.left = (x - tr.width - pad) + 'px';
    if (tr.bottom > window.innerHeight) tooltip.style.top = (y - tr.height - pad) + 'px';
  }

  _onClick(e) {
    if (!this.hoveredObject) return;
    const ud = this.hoveredObject.userData;
    if (!ud || !ud.type) return;

    this._openDetailPanel(ud);

    // Camera focus on clicked object
    let focusPos = null;

    switch (ud.type) {
      case 'pipe': {
        const pos = this.network.getPipeWorldPosition(ud.id);
        if (pos) focusPos = pos;
        break;
      }
      case 'sensor': {
        const sensor = this.sensors.getSensor(ud.id);
        if (sensor) focusPos = sensor.group.position.clone();
        break;
      }
      case 'valve': {
        const valve = this.network.valves.get(ud.id);
        if (valve) focusPos = valve.group.position.clone();
        break;
      }
      case 'pump': {
        const pump = this.network.pumps.get(ud.id);
        if (pump) focusPos = pump.group.position.clone();
        break;
      }
      case 'tank': {
        const tank = this.network.tanks.get(ud.id);
        if (tank) focusPos = tank.group.position.clone();
        break;
      }
      case 'junction': {
        const junc = this.network.junctions.get(ud.id);
        if (junc) focusPos = junc.mesh.position.clone();
        break;
      }
    }

    if (focusPos) {
      this.world.focusOn(
        new THREE.Vector3(focusPos.x + 5, 4, focusPos.z + 5),
        focusPos,
        1.2
      );
    }
  }

  _openDetailPanel(userData) {
    const panel = document.getElementById('detail-panel');
    const idEl = document.getElementById('detail-id');
    const typeEl = document.getElementById('detail-type');
    const bodyEl = document.getElementById('detail-body');
    const chartEl = document.getElementById('mini-chart');

    let id = userData.id || '—';
    let type = userData.type?.toUpperCase() || '—';
    let rows = '';
    let showChart = false;

    switch (userData.type) {
      case 'pipe': {
        const pipeEntry = this.network.pipes.get(userData.id);
        const d = pipeEntry?.data;
        type = 'PIPE SEGMENT';
        if (d) {
          rows = `
            <div class="detail-row"><span class="label">PRESSURE</span><span class="value">${d.pressure} bar</span></div>
            <div class="detail-row"><span class="label">FLOW</span><span class="value">${d.flow} L/min</span></div>
            <div class="detail-row"><span class="label">ZONE</span><span class="value">${d.zone}</span></div>
            <div class="detail-row"><span class="label">HEALTH</span><span class="value" style="color:${d.health === 'CRITICAL' ? 'var(--red)' : 'var(--green)'}">${d.health}</span></div>
            <div class="detail-row"><span class="label">AI CONFIDENCE</span><span class="value" style="color:${d.leakConfidence > 0.5 ? 'var(--red)' : 'var(--green)'}">${(d.leakConfidence * 100).toFixed(1)}%</span></div>
            <div class="detail-row"><span class="label">EST. LOSS</span><span class="value">${d.leakConfidence > 0.5 ? '142 L/min' : '—'}</span></div>
          `;
        }
        break;
      }
      case 'sensor': {
        const sensor = this.sensors.getSensor(userData.id);
        const sd = sensor?.data;
        type = sd ? `${sd.type.toUpperCase()} SENSOR` : 'SENSOR';
        if (sd) {
          const deviation = sd.normalValue > 0 ? (((sd.currentValue - sd.normalValue) / sd.normalValue) * 100).toFixed(1) : '0';
          const anomalyScore = userData.id === 'S-07' ? '0.94' : '0.02';
          rows = `
            <div class="detail-row"><span class="label">TYPE</span><span class="value">${sd.type.toUpperCase()}</span></div>
            <div class="detail-row"><span class="label">CURRENT</span><span class="value">${sd.currentValue} ${sd.unit}</span></div>
            <div class="detail-row"><span class="label">NORMAL</span><span class="value">${sd.normalValue} ${sd.unit}</span></div>
            <div class="detail-row"><span class="label">DEVIATION</span><span class="value" style="color:${Math.abs(parseFloat(deviation)) > 10 ? 'var(--red)' : 'var(--green)'}">${deviation}%</span></div>
            <div class="detail-row"><span class="label">ANOMALY SCORE</span><span class="value" style="color:${parseFloat(anomalyScore) > 0.5 ? 'var(--red)' : 'var(--green)'}">${anomalyScore}</span></div>
            <div class="detail-row"><span class="label">STATUS</span><span class="value" style="color:${sensor.state === 'CRITICAL' ? 'var(--red)' : 'var(--green)'}">${sensor.state}</span></div>
          `;
          showChart = true;
        }
        break;
      }
      case 'valve': {
        type = 'VALVE';
        rows = `
          <div class="detail-row"><span class="label">STATUS</span><span class="value" style="color:var(--green)">OPEN</span></div>
          <div class="detail-row"><span class="label">OPEN %</span><span class="value">${userData.openPct ?? 100}%</span></div>
        `;
        break;
      }
      case 'pump': {
        type = 'PUMP STATION';
        rows = `
          <div class="detail-row"><span class="label">FLOW</span><span class="value">${userData.flow ?? 420} L/min</span></div>
          <div class="detail-row"><span class="label">STATUS</span><span class="value" style="color:var(--green)">${userData.status ?? 'ONLINE'}</span></div>
        `;
        break;
      }
      case 'tank': {
        type = 'STORAGE TANK';
        rows = `
          <div class="detail-row"><span class="label">LEVEL</span><span class="value">${userData.level ?? 78}%</span></div>
          <div class="detail-row"><span class="label">CAPACITY</span><span class="value">5000 L</span></div>
        `;
        break;
      }
    }

    idEl.textContent = id;
    typeEl.textContent = type;
    bodyEl.innerHTML = rows;
    chartEl.style.display = showChart ? 'block' : 'none';

    if (showChart) {
      this._drawMiniChart(userData.id);
    }

    panel.classList.add('open');
  }

  _closeDetailPanel() {
    document.getElementById('detail-panel').classList.remove('open');
  }

  _drawMiniChart(sensorId) {
    const canvas = document.getElementById('mini-chart-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.parentElement.clientWidth;
    const h = 80;
    canvas.width = w;
    canvas.height = h;

    ctx.clearRect(0, 0, w, h);

    // Generate fake time-series data
    const isAnomaly = sensorId === 'S-07';
    const points = 60;
    const data = [];
    const baseline = 5.8;

    for (let i = 0; i < points; i++) {
      if (isAnomaly && i > 40) {
        // Pressure drop
        const drop = (i - 40) / 20;
        data.push(baseline - drop * 2.4 + (Math.random() - 0.5) * 0.2);
      } else {
        data.push(baseline + (Math.random() - 0.5) * 0.3);
      }
    }

    const minVal = Math.min(...data) - 0.5;
    const maxVal = Math.max(...data) + 0.5;

    // Draw grid lines
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const y = (h / 4) * i + h / 8;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = isAnomaly ? '#ff3344' : '#00d4ff';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < points; i++) {
      const x = (i / (points - 1)) * w;
      const y = h - ((data[i] - minVal) / (maxVal - minVal)) * (h - 10) - 5;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Fill area under curve
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = isAnomaly ? 'rgba(255, 51, 68, 0.1)' : 'rgba(0, 212, 255, 0.08)';
    ctx.fill();
  }

  // ═══════════════════════════════════════
  //  CONTROL ACTIONS
  // ═══════════════════════════════════════

  _handleControl(action) {
    switch (action) {
      case 'monitor':
        this._resetAll();
        break;

      case 'demo':
        if (this.demo.isRunning) {
          this.demo.stop();
        } else {
          this.demo.start();
        }
        break;

      case 'graph':
        this.graphMode = !this.graphMode;
        this.ai.showGraphAnalysis(this.graphMode);
        this._setControlActive(this.graphMode ? 'graph' : 'monitor');
        break;

      case 'sensors':
        this.sensorMode = !this.sensorMode;
        this._setControlActive(this.sensorMode ? 'sensors' : 'monitor');
        // Could toggle sensor label visibility here
        break;

      case 'leak':
        this._showLeakDirect();
        break;

      case 'workorder':
        this._showWorkOrder();
        break;

      case 'reset':
        this._resetAll();
        break;
    }
  }

  _showLeakDirect() {
    // Directly show leak on P-17
    const p17data = this.network.pipes.get('P-17');
    if (p17data) {
      p17data.data.health = 'CRITICAL';
      p17data.data.leakConfidence = 0.964;
    }

    this.sensors.triggerAnomaly('S-07');
    this.flow.setAnomalyRegion('P-17');
    this.network.dimAll(['P-17', 'P-15', 'P-16', 'P-18', 'P-19']);
    this.network.highlightPipe('P-17', new THREE.Color(0xff3344));

    const p17pos = this.network.getPipeWorldPosition('P-17');
    const leakPos = p17pos.clone();
    leakPos.y += 0.15;
    this.leak.activate(leakPos, new THREE.Vector3(0, 1, 0.5).normalize());

    this._updateLeakPanel(true, 'P-17', '96.4%', '142 L/min', 'CRITICAL');
    this._updateTopBar('92%', '01');
    this._updateAIPanel('LSTM / TRANSFORMER', 'ANOMALY DETECTED', '0.94', 'P-17 — 96.4%');

    this.world.focusOn(
      new THREE.Vector3(p17pos.x + 4, 3.5, p17pos.z + 4),
      p17pos,
      2
    );
    this._setControlActive('leak');
  }

  _resetAll() {
    if (this.demo.isRunning) this.demo.stop();

    this.network.resetHighlights();
    this.sensors.resetAll();
    this.leak.deactivate();
    this.ai.reset();
    this.flow.clearAnomalyRegion();
    this.graphMode = false;
    this.sensorMode = false;

    // Reset P-17 data
    const p17data = this.network.pipes.get('P-17');
    if (p17data) {
      p17data.data.health = 'NORMAL';
      p17data.data.leakConfidence = 0;
    }

    this._updateLeakPanel(false);
    this._updateTopBar('100%', '00');
    this._updateAIPanel('LSTM / TRANSFORMER', 'MONITORING', '0.00', 'STANDBY');
    this._setControlActive('monitor');
    this._closeDetailPanel();
    this.world.resetCamera(2);
  }

  // ═══════════════════════════════════════
  //  UI UPDATE METHODS
  // ═══════════════════════════════════════

  _showDemoText(text, subtext) {
    const overlay = document.getElementById('demo-overlay');
    const textEl = document.getElementById('demo-text');
    const subEl = document.getElementById('demo-subtext');

    textEl.textContent = text;
    subEl.textContent = subtext || '';
    overlay.classList.add('visible');

    if (window.gsap) {
      window.gsap.fromTo(textEl, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' });
      window.gsap.fromTo(subEl, { opacity: 0 }, { opacity: 1, duration: 0.6, delay: 0.3 });
    } else {
      textEl.style.opacity = '1';
      textEl.style.transform = 'translateY(0)';
      subEl.style.opacity = '1';
    }
  }

  _hideDemoText() {
    const overlay = document.getElementById('demo-overlay');
    const textEl = document.getElementById('demo-text');
    const subEl = document.getElementById('demo-subtext');

    if (window.gsap) {
      window.gsap.to([textEl, subEl], {
        opacity: 0,
        duration: 0.4,
        onComplete: () => overlay.classList.remove('visible')
      });
    } else {
      overlay.classList.remove('visible');
    }
  }

  _updateAIPanel(model, status, score, gnn) {
    const el = (id) => document.getElementById(id);
    el('ai-model').textContent = model;
    el('ai-status').textContent = status;
    el('ai-score').textContent = score;
    el('ai-gnn').textContent = gnn;

    // Color status
    const statusEl = el('ai-status');
    if (status.includes('ANOMALY') || status.includes('DETECTED')) {
      statusEl.style.color = 'var(--red)';
    } else if (status.includes('ANALYZING') || status.includes('PROCESSING')) {
      statusEl.style.color = 'var(--yellow)';
    } else {
      statusEl.style.color = 'var(--green)';
    }
  }

  _updateLeakPanel(show, pipe, conf, loss, status) {
    const panel = document.getElementById('leak-panel');
    if (show) {
      document.getElementById('leak-pipe').textContent = pipe || 'P-17';
      document.getElementById('leak-conf').textContent = conf || '96.4%';
      document.getElementById('leak-loss').textContent = loss || '142 L/min';
      document.getElementById('leak-status').textContent = status || 'CRITICAL';
      panel.classList.add('visible');
    } else {
      panel.classList.remove('visible');
    }
  }

  _updateTopBar(health, anomalyCount) {
    const healthEl = document.getElementById('net-health');
    const anomalyEl = document.getElementById('anomaly-count');

    healthEl.textContent = health;
    anomalyEl.textContent = anomalyCount;

    const healthNum = parseInt(health);
    if (healthNum < 95) {
      healthEl.style.color = 'var(--yellow)';
    } else {
      healthEl.style.color = 'var(--green)';
    }

    if (anomalyCount !== '00' && anomalyCount !== '0') {
      anomalyEl.style.color = 'var(--red)';
    } else {
      anomalyEl.style.color = 'var(--green)';
    }
  }

  _setControlActive(action) {
    document.querySelectorAll('.ctrl-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.action === action);
    });
  }

  _showWorkOrder() {
    document.getElementById('work-order-modal').classList.add('visible');
    // Animate dispatch text
    const dispatch = document.getElementById('wo-dispatch');
    if (dispatch && window.gsap) {
      window.gsap.fromTo(dispatch,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.5, delay: 0.3 }
      );
    }
  }

  _startSyncTimer() {
    let seconds = 0;
    setInterval(() => {
      seconds++;
      const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
      const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
      const s = String(seconds % 60).padStart(2, '0');
      const el = document.getElementById('sync-time');
      if (el) el.textContent = `${h}:${m}:${s}`;
    }, 1000);
  }

  // ═══════════════════════════════════════
  //  RENDER LOOP
  // ═══════════════════════════════════════

  _animate() {
    requestAnimationFrame(() => this._animate());

    const delta = this.world.clock.getDelta();
    const clampedDelta = Math.min(delta, 0.05); // Prevent large jumps

    // Update systems
    this.network.update(clampedDelta);
    this.sensors.update(clampedDelta);
    this.flow.update(clampedDelta);
    this.leak.update(clampedDelta);
    this.ai.update(clampedDelta);

    // Render
    this.world.render();
  }
}

// ── Launch ──
const app = new App();
