import * as THREE from 'three';

function wait(ms) { 
  return new Promise(r => setTimeout(r, ms)); 
}

export class DemoMode {
  constructor({ world, network, sensors, flow, leak, ai, ui }) {
    this.world = world;
    this.network = network;
    this.sensors = sensors;
    this.flow = flow;
    this.leak = leak;
    this.ai = ai;
    this.ui = ui;
    
    this.isRunning = false;
  }

  async start() {
    this.isRunning = true;
    
    // Reset everything first
    this.network.resetHighlights();
    this.sensors.resetAll();
    this.leak.deactivate();
    this.ai.reset();
    this.flow.clearAnomalyRegion();
    this.ui.updateLeakPanel(false);
    this.ui.updateTopBar('100%', '00');
    this.ui.updateAIPanel('LSTM / TRANSFORMER', 'MONITORING', '0.00', 'STANDBY');
    
    // Phase 1: Overview (0-5s)
    this.ui.setControlActive('monitor');
    this.world.resetCamera(2);
    await wait(1000);
    this.ui.showDemoText('LIVE PIPELINE DIGITAL TWIN', 'Real-time monitoring of industrial pipeline network');
    await wait(4000);
    if (!this.isRunning) return;
    
    // Phase 2: Sensor Activation (5-10s)
    this.ui.showDemoText('SCADA SENSOR STREAM', '12 IoT sensors reporting pressure + flow data');
    this.ui.setControlActive('sensors');
    // Camera pans to show sensors
    this.world.focusOn(new THREE.Vector3(0, 8, 15), new THREE.Vector3(0, 0, 5), 2);
    await wait(5000);
    if (!this.isRunning) return;
    
    // Phase 3: Anomaly Detection (10-15s)
    this.ui.showDemoText('ANOMALY DETECTED', 'Sensor S-07 reports abnormal pressure drop');
    this.ui.updateAIPanel('LSTM / TRANSFORMER', 'PROCESSING...', '—', 'STANDBY');
    this.sensors.triggerAnomaly('S-07');
    this.sensors.sendPulse('S-07');
    this.flow.setAnomalyRegion('P-17');
    this.ui.updateTopBar('92%', '01');
    // Focus camera near S-07/P-17 area
    const s7pos = this.sensors.getSensor('S-07')?.group?.position || new THREE.Vector3(-4, 0, 6);
    this.world.focusOn(
      new THREE.Vector3(s7pos.x + 8, 6, s7pos.z + 8),
      new THREE.Vector3(s7pos.x, 0, s7pos.z),
      2
    );
    await wait(5000);
    if (!this.isRunning) return;
    
    // Phase 4: LSTM/Transformer Analysis (15-21s)
    this.ui.showDemoText('LSTM / TRANSFORMER AUTOENCODER', 'Analyzing pressure + flow time series patterns');
    this.ui.updateAIPanel('LSTM / TRANSFORMER', 'ANALYZING...', '0.94', 'STANDBY');
    await wait(3000);
    this.ui.updateAIPanel('LSTM / TRANSFORMER', 'ANOMALY DETECTED', '0.94', 'ACTIVATING...');
    await wait(3000);
    if (!this.isRunning) return;
    
    // Phase 5: GNN Graph Localization (21-27s)
    this.ui.showDemoText('GRAPH NEURAL NETWORK', 'Localizing leak on pipeline topology graph');
    this.ui.setControlActive('graph');
    this.ui.updateAIPanel('LSTM / TRANSFORMER', 'ANOMALY DETECTED', '0.94', 'LOCALIZING...');
    this.ai.showGraphAnalysis(true);
    this.world.focusOn(new THREE.Vector3(12, 18, 18), new THREE.Vector3(0, 0, 8), 2);
    await wait(6000);
    if (!this.isRunning) return;
    
    // Phase 6: Candidate Ranking (27-32s)
    this.ui.showDemoText('CANDIDATE RANKING', 'GNN evaluating pipeline segments');
    const scores = new Map([
      ['P-12', 0.18],
      ['P-14', 0.27],
      ['P-16', 0.41],
      ['P-17', 0.964],
      ['P-18', 0.22],
      ['P-15', 0.12]
    ]);
    this.ai.showCandidateScores(scores);
    await wait(3000);
    // Highlight P-17 as winner
    this.network.highlightPipe('P-17', new THREE.Color(0xff3344));
    this.ui.updateAIPanel('LSTM / TRANSFORMER', 'ANOMALY DETECTED', '0.94', 'P-17 — 96.4%');
    await wait(2000);
    if (!this.isRunning) return;
    
    // Phase 7: Camera moves to P-17 (32-37s)
    this.ui.showDemoText('LEAK LOCALIZED', 'Pipe P-17 — 96.4% confidence');
    this.ui.setControlActive('leak');
    this.ai.hideCandidateScores();
    this.ai.showGraphAnalysis(false);
    this.network.dimAll(['P-17', 'P-15', 'P-16', 'P-18', 'P-19']);
    
    const p17pos = this.network.getPipeWorldPosition('P-17');
    this.world.focusOn(
      new THREE.Vector3(p17pos.x + 5, 4, p17pos.z + 5),
      p17pos,
      2.5
    );
    await wait(5000);
    if (!this.isRunning) return;
    
    // Phase 8: Leak Effect (37-42s)
    this.ui.hideDemoText();
    
    // Activate leak effect at P-17 midpoint
    const leakPos = p17pos.clone();
    leakPos.y += 0.15;
    const leakDir = new THREE.Vector3(0, 1, 0.5).normalize();
    this.leak.activate(leakPos, leakDir);
    
    // Show leak panel
    this.ui.updateLeakPanel(true, 'P-17', '96.4%', '142 L/min', 'CRITICAL');
    
    // Closer camera
    this.world.focusOn(
      new THREE.Vector3(p17pos.x + 3, 2.5, p17pos.z + 3),
      leakPos,
      2
    );
    
    await wait(2000);
    this.ui.showDemoText('LEAK LOCALIZED', 'P-17 · 96.4% CONFIDENCE · 142 L/min LOSS');
    await wait(3000);
    if (!this.isRunning) return;
    
    // Phase 9: Work Order (42-47s)
    this.ui.showDemoText('RESPONSE INITIATED', 'Work order generated · Field crew dispatched');
    this.ui.setControlActive('workorder');
    await wait(2000);
    this.ui.showWorkOrder();
    await wait(3000);
    if (!this.isRunning) return;
    
    // Phase 10: Return to monitoring
    this.ui.hideDemoText();
    this.ui.setControlActive('monitor');
    this.world.resetCamera(3);
    // Keep leak visible, keep alert panel showing
    this.isRunning = false;
  }
  
  stop() {
    this.isRunning = false;
    this.network.resetHighlights();
    this.sensors.resetAll();
    this.leak.deactivate();
    this.ai.reset();
    this.flow.clearAnomalyRegion();
    this.ui.hideDemoText();
    this.ui.updateLeakPanel(false);
    this.ui.updateTopBar('100%', '00');
    this.ui.updateAIPanel('LSTM / TRANSFORMER', 'MONITORING', '0.00', 'STANDBY');
    this.world.resetCamera(2);
  }
}
