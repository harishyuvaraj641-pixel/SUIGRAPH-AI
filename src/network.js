import * as THREE from 'three';

export const NETWORK_DATA = {
  nodes: {
    'TANK-01': { type: 'tank', position: [-18, 0, -12] },
    'TANK-02': { type: 'tank', position: [18, 0, -12] },
    'PUMP-01': { type: 'pump', position: [-18, 0, -5] },
    'PUMP-02': { type: 'pump', position: [18, 0, -5] },
    'V-01': { type: 'valve', position: [-14, 0, -2], openPct: 100 },
    'V-02': { type: 'valve', position: [14, 0, -2], openPct: 92 },
    'V-03': { type: 'valve', position: [0, 0, 0], openPct: 100 },
    'V-04': { type: 'valve', position: [-10, 0, 9], openPct: 88 },
    'V-05': { type: 'valve', position: [10, 0, 9], openPct: 95 },
    'N-01': { type: 'junction', position: [-10, 0, 0] },
    'N-02': { type: 'junction', position: [-4, 0, 0] },
    'N-03': { type: 'junction', position: [4, 0, 0] },
    'N-04': { type: 'junction', position: [10, 0, 0] },
    'N-05': { type: 'junction', position: [-10, 0, 6] },
    'N-06': { type: 'junction', position: [-10, 0, 14] },
    'N-07': { type: 'junction', position: [-4, 0, 14] },
    'N-08': { type: 'junction', position: [-4, 0, 6] },
    'N-09': { type: 'junction', position: [4, 0, 6] },
    'N-10': { type: 'junction', position: [0, 0, 11] },
    'N-11': { type: 'junction', position: [4, 0, 16] },
    'N-12': { type: 'junction', position: [10, 0, 6] },
    'N-13': { type: 'junction', position: [10, 0, 14] },
    'N-14': { type: 'junction', position: [4, 0, 14] }
  },
  pipes: [
    { id: 'P-01', start: 'TANK-01', end: 'PUMP-01', zone: 'SUPPLY' },
    { id: 'P-02', start: 'TANK-02', end: 'PUMP-02', zone: 'SUPPLY' },
    { id: 'P-03', start: 'PUMP-01', end: 'V-01', zone: 'SUPPLY' },
    { id: 'P-04', start: 'PUMP-02', end: 'V-02', zone: 'SUPPLY' },
    { id: 'P-05', start: 'V-01', end: 'N-01', zone: 'MAIN' },
    { id: 'P-06', start: 'N-01', end: 'N-02', zone: 'MAIN' },
    { id: 'P-07', start: 'N-02', end: 'V-03', zone: 'MAIN' },
    { id: 'P-08', start: 'V-03', end: 'N-03', zone: 'MAIN' },
    { id: 'P-09', start: 'N-03', end: 'N-04', zone: 'MAIN' },
    { id: 'P-10', start: 'V-02', end: 'N-04', zone: 'MAIN' },
    { id: 'P-11', start: 'N-01', end: 'N-05', zone: 'ZONE-01' },
    { id: 'P-12', start: 'N-05', end: 'V-04', zone: 'ZONE-01' },
    { id: 'P-13', start: 'V-04', end: 'N-06', zone: 'ZONE-01' },
    { id: 'P-14', start: 'N-06', end: 'N-07', zone: 'ZONE-01' },
    { id: 'P-15', start: 'N-02', end: 'N-08', zone: 'ZONE-02' },
    { id: 'P-16', start: 'N-03', end: 'N-09', zone: 'ZONE-02' },
    { id: 'P-17', start: 'N-08', end: 'N-10', zone: 'ZONE-02' },
    { id: 'P-18', start: 'N-09', end: 'N-10', zone: 'ZONE-02' },
    { id: 'P-19', start: 'N-10', end: 'N-11', zone: 'ZONE-02' },
    { id: 'P-20', start: 'N-04', end: 'N-12', zone: 'ZONE-03' },
    { id: 'P-21', start: 'N-12', end: 'V-05', zone: 'ZONE-03' },
    { id: 'P-22', start: 'V-05', end: 'N-13', zone: 'ZONE-03' },
    { id: 'P-23', start: 'N-13', end: 'N-14', zone: 'ZONE-03' },
    { id: 'P-24', start: 'N-13', end: [12, 0, 18], zone: 'ZONE-03' },
    { id: 'P-25', start: 'N-07', end: 'N-10', zone: 'CROSS' },
    { id: 'P-26', start: 'N-14', end: 'N-11', zone: 'CROSS' },
    { id: 'P-27', start: 'N-05', end: 'N-08', zone: 'ZONE-01' },
    { id: 'P-28', start: 'N-09', end: 'N-12', zone: 'ZONE-02' },
    { id: 'P-29', start: 'N-06', end: [-14, 0, 18], zone: 'ZONE-01' },
    { id: 'P-30', start: 'N-11', end: [6, 0, 20], zone: 'ZONE-02' },
    { id: 'P-31', start: 'N-07', end: [-1, 0, 18], zone: 'ZONE-01' },
    { id: 'P-32', start: 'N-14', end: [2, 0, 18], zone: 'ZONE-03' }
  ].map(p => ({
    ...p,
    pressure: p.id === 'P-17' ? 3.41 : 5.8,
    flow: p.id === 'P-17' ? 164 : 420,
    health: 'NORMAL',
    leakConfidence: 0
  })),
  sensors: [
    { id: 'S-01', pipeId: 'P-01', type: 'flow', normalValue: 420, currentValue: 420, unit: 'L/min' },
    { id: 'S-02', pipeId: 'P-02', type: 'flow', normalValue: 420, currentValue: 420, unit: 'L/min' },
    { id: 'S-03', pipeId: 'P-06', type: 'pressure', normalValue: 5.8, currentValue: 5.8, unit: 'bar' },
    { id: 'S-04', pipeId: 'P-09', type: 'pressure', normalValue: 5.8, currentValue: 5.8, unit: 'bar' },
    { id: 'S-05', pipeId: 'P-11', type: 'pressure', normalValue: 5.8, currentValue: 5.8, unit: 'bar' },
    { id: 'S-06', pipeId: 'P-13', type: 'flow', normalValue: 420, currentValue: 420, unit: 'L/min' },
    { id: 'S-07', pipeId: 'P-17', type: 'pressure', normalValue: 5.82, currentValue: 3.41, unit: 'bar' },
    { id: 'S-08', pipeId: 'P-18', type: 'flow', normalValue: 420, currentValue: 420, unit: 'L/min' },
    { id: 'S-09', pipeId: 'P-19', type: 'pressure', normalValue: 5.8, currentValue: 5.8, unit: 'bar' },
    { id: 'S-10', pipeId: 'P-20', type: 'flow', normalValue: 420, currentValue: 420, unit: 'L/min' },
    { id: 'S-11', pipeId: 'P-22', type: 'pressure', normalValue: 5.8, currentValue: 5.8, unit: 'bar' },
    { id: 'S-12', pipeId: 'P-28', type: 'flow', normalValue: 420, currentValue: 420, unit: 'L/min' }
  ]
};

export class PipelineNetwork {
  constructor(scene) {
    this.scene = scene;
    
    this.pipes = new Map();
    this.junctions = new Map();
    this.valves = new Map();
    this.pumps = new Map();
    this.tanks = new Map();
    this.graphEdges = [];
    this.graphNodes = [];
    this.scoreSprites = new Map();
    this.interactables = [];

    // Base Materials
    this.pipeMaterialNormal = new THREE.MeshStandardMaterial({
      color: 0x3a5a7a,
      metalness: 0.6,
      roughness: 0.35,
      emissive: 0x0088aa,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 1
    });

    this.junctionMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a6080,
      metalness: 0.7,
      emissive: 0x00aacc,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 1.0
    });

    this.buildNetwork();
  }

  getPos(nodeOrCoords) {
    if (typeof nodeOrCoords === 'string' && NETWORK_DATA.nodes[nodeOrCoords]) {
      return new THREE.Vector3().fromArray(NETWORK_DATA.nodes[nodeOrCoords].position);
    } else if (Array.isArray(nodeOrCoords)) {
      return new THREE.Vector3().fromArray(nodeOrCoords);
    }
    return new THREE.Vector3();
  }

  buildNetwork() {
    const networkGroup = new THREE.Group();
    this.scene.add(networkGroup);

    // 1. Create Tanks
    ['TANK-01', 'TANK-02'].forEach(id => {
      const node = NETWORK_DATA.nodes[id];
      const pos = this.getPos(node.position);
      
      const group = new THREE.Group();
      
      // Tank Body
      const bodyGeo = new THREE.CylinderGeometry(1.5, 1.5, 4, 20);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x223344, metalness: 0.6, roughness: 0.4, transparent: true, opacity: 0.8 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 2; // base at 0
      group.add(body);
      
      // Lid
      const lidGeo = new THREE.CylinderGeometry(1.55, 1.55, 0.1, 20);
      const lidMat = new THREE.MeshStandardMaterial({ color: 0x112233, metalness: 0.8, roughness: 0.2 });
      const lid = new THREE.Mesh(lidGeo, lidMat);
      lid.position.y = 4.05;
      group.add(lid);
      
      // Legs
      const legGeo = new THREE.CylinderGeometry(0.08, 0.08, 1, 6);
      const legMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
      const legPositions = [[1,0.5,1], [-1,0.5,1], [1,0.5,-1], [-1,0.5,-1]];
      legPositions.forEach(p => {
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(p[0], p[1]-1, p[2]);
        group.add(leg);
      });
      
      // Water level indicator
      const levelGeo = new THREE.CylinderGeometry(1.45, 1.45, 3.8, 20);
      const levelMat = new THREE.MeshStandardMaterial({ color: 0x0088ff, transparent: true, opacity: 0.6 });
      const levelMesh = new THREE.Mesh(levelGeo, levelMat);
      levelMesh.position.y = 2;
      group.add(levelMesh);
      
      group.position.copy(pos);
      // Elevate the entire tank base to y=1 so legs reach y=0
      group.position.y = 1;
      
      const tankData = { type: 'tank', id, level: id === 'TANK-01' ? 78 : 65 };
      group.userData = tankData;
      body.userData = tankData; // for raycaster
      
      this.tanks.set(id, { group, data: tankData });
      networkGroup.add(group);
      this.interactables.push(body);
    });

    // 2. Create Pumps
    ['PUMP-01', 'PUMP-02'].forEach(id => {
      const node = NETWORK_DATA.nodes[id];
      const pos = this.getPos(node.position);
      
      const group = new THREE.Group();
      
      const bodyGeo = new THREE.BoxGeometry(1.2, 0.8, 0.8);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1a2530, metalness: 0.7 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.4;
      group.add(body);
      
      const motorGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.6, 12);
      const motor = new THREE.Mesh(motorGeo, bodyMat);
      motor.position.y = 0.8 + 0.3;
      group.add(motor);
      
      // Rotor
      const rotorGroup = new THREE.Group();
      const bladeGeo = new THREE.BoxGeometry(0.5, 0.1, 0.1);
      const blade1 = new THREE.Mesh(bladeGeo, bodyMat);
      const blade2 = new THREE.Mesh(bladeGeo, bodyMat);
      blade2.rotation.y = Math.PI / 2;
      rotorGroup.add(blade1, blade2);
      rotorGroup.position.set(0, 0.4, 0.45);
      group.add(rotorGroup);
      
      // Status light
      const lightGeo = new THREE.SphereGeometry(0.05);
      const lightMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      const light = new THREE.Mesh(lightGeo, lightMat);
      light.position.set(0, 1.2, 0.2);
      group.add(light);
      
      group.position.copy(pos);
      
      const pumpData = { type: 'pump', id, flow: 420, status: 'ONLINE' };
      group.userData = pumpData;
      body.userData = pumpData;
      
      this.pumps.set(id, { group, data: pumpData, rotor: rotorGroup });
      networkGroup.add(group);
      this.interactables.push(body);
    });

    // 3. Create Valves
    const valveIds = Object.keys(NETWORK_DATA.nodes).filter(k => NETWORK_DATA.nodes[k].type === 'valve');
    valveIds.forEach(id => {
      const node = NETWORK_DATA.nodes[id];
      const pos = this.getPos(node.position);
      
      const group = new THREE.Group();
      const material = new THREE.MeshStandardMaterial({ color: 0x2a3a4a, metalness: 0.8 });
      
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.5, 8), material);
      body.rotation.z = Math.PI / 2;
      group.add(body);
      
      const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.03, 8, 16), material);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.y = 0.35;
      group.add(wheel);
      
      const flange1 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 8), material);
      flange1.rotation.z = Math.PI / 2;
      flange1.position.x = 0.3;
      group.add(flange1);
      
      const flange2 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 8), material);
      flange2.rotation.z = Math.PI / 2;
      flange2.position.x = -0.3;
      group.add(flange2);
      
      const indicatorMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      const indicator = new THREE.Mesh(new THREE.SphereGeometry(0.06), indicatorMat);
      indicator.position.set(0, 0.4, 0);
      group.add(indicator);
      
      group.position.copy(pos);
      // Orient valves along Z axis if they are on Z-axis pipes, but X-axis is fine generally for this top-down view
      // If we know the exact pipe connections, we could compute orientation. For now, default orientation.
      if (id === 'V-04' || id === 'V-05') {
        group.rotation.y = Math.PI / 2; // Orient along Z
      }
      
      const valveData = { type: 'valve', id, openPct: node.openPct };
      group.userData = valveData;
      body.userData = valveData;
      
      this.valves.set(id, { group, data: valveData, indicator });
      networkGroup.add(group);
      this.interactables.push(body);
    });

    // 4. Create Junctions
    const junctionIds = Object.keys(NETWORK_DATA.nodes).filter(k => NETWORK_DATA.nodes[k].type === 'junction');
    junctionIds.forEach(id => {
      const pos = this.getPos(NETWORK_DATA.nodes[id].position);
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), this.junctionMaterial);
      mesh.position.copy(pos);
      
      const junctionData = { type: 'junction', id };
      mesh.userData = junctionData;
      
      this.junctions.set(id, { mesh, data: junctionData });
      networkGroup.add(mesh);
      this.interactables.push(mesh);
    });

    // 5. Create Pipes
    NETWORK_DATA.pipes.forEach(pipeDef => {
      const startPos = this.getPos(pipeDef.start);
      const endPos = this.getPos(pipeDef.end);
      
      let points = [];
      if ((pipeDef.id === 'P-01' || pipeDef.id === 'P-02') && startPos.y === 0) {
        // Drop down curve for tank to pump
        const dir = pipeDef.id === 'P-01' ? -1 : 1;
        const x = dir * 18;
        // Startpos is tank base, actual output might be higher. Let's make a cool curve.
        points = [
          new THREE.Vector3(x, 2, -12),
          new THREE.Vector3(x, 2, -8),
          new THREE.Vector3(x, 0.4, -5)
        ];
      } else {
        // Straight line
        points = [startPos, endPos];
      }
      
      const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.1);
      
      const radius = pipeDef.zone === 'MAIN' ? 0.28 : 0.22;
      const geometry = new THREE.TubeGeometry(curve, 48, radius, 10, false);
      const material = this.pipeMaterialNormal.clone();
      const mesh = new THREE.Mesh(geometry, material);
      
      mesh.userData = { type: 'pipe', id: pipeDef.id };
      
      this.pipes.set(pipeDef.id, {
        mesh,
        curve,
        data: { ...pipeDef },
        startPos,
        endPos
      });
      
      networkGroup.add(mesh);
      this.interactables.push(mesh);
      
      // Graph Edges (Initially invisible)
      const lineGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(10));
      const lineMat = new THREE.LineBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.6 });
      const line = new THREE.Line(lineGeo, lineMat);
      line.visible = false;
      this.graphEdges.push(line);
      networkGroup.add(line);
    });

    // Graph Nodes (Initially invisible)
    Object.keys(NETWORK_DATA.nodes).forEach(nodeId => {
      const pos = this.getPos(NETWORK_DATA.nodes[nodeId].position);
      const nodeGeo = new THREE.SphereGeometry(0.15);
      const nodeMat = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 1,
        transparent: true,
        opacity: 0.8
      });
      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
      nodeMesh.position.copy(pos);
      if (NETWORK_DATA.nodes[nodeId].type === 'tank') {
        nodeMesh.position.y = 2;
      }
      nodeMesh.visible = false;
      this.graphNodes.push(nodeMesh);
      networkGroup.add(nodeMesh);
    });
  }

  highlightPipe(id, color) {
    const pipe = this.pipes.get(id);
    if (pipe) {
      if (color instanceof THREE.Color) {
        pipe.mesh.material.emissive.copy(color);
      } else {
        pipe.mesh.material.emissive.setHex(color);
      }
      pipe.mesh.material.emissiveIntensity = 0.5;
    }
  }

  dimAll(exceptIds = []) {
    this.pipes.forEach((pipe, id) => {
      if (!exceptIds.includes(id)) {
        pipe.mesh.material.opacity = 0.4;
        pipe.mesh.material.emissiveIntensity = 0.1;
      } else {
        pipe.mesh.material.opacity = 1.0;
      }
    });
  }

  resetHighlights() {
    this.pipes.forEach((pipe) => {
      pipe.mesh.material.emissive.setHex(0x0088aa);
      pipe.mesh.material.emissiveIntensity = 0.35;
      pipe.mesh.material.opacity = 1.0;
    });
  }

  showGraphOverlay(show) {
    this.graphEdges.forEach(edge => edge.visible = show);
    this.graphNodes.forEach(node => node.visible = show);
    
    // Dim normal pipes when graph is shown to make overlay pop
    if (show) {
      this.pipes.forEach(pipe => pipe.mesh.material.opacity = 0.3);
      this.junctions.forEach(j => j.mesh.material.opacity = 0.4);
    } else {
      this.resetHighlights();
      this.junctions.forEach(j => j.mesh.material.opacity = 1.0);
    }
  }

  showCandidateScore(pipeId, score) {
    const pipe = this.pipes.get(pipeId);
    if (!pipe) return;
    
    if (this.scoreSprites.has(pipeId)) {
      this.scene.remove(this.scoreSprites.get(pipeId));
      this.scoreSprites.delete(pipeId);
    }

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.roundRect(10, 10, 236, 108, 20);
    ctx.fill();
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 4;
    ctx.stroke();
    
    ctx.font = 'bold 64px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${(score * 100).toFixed(1)}%`, 128, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    
    const center = this.getPipeWorldPosition(pipeId);
    sprite.position.copy(center);
    sprite.position.y += 1.5;
    sprite.scale.set(3, 1.5, 1);
    
    this.scene.add(sprite);
    this.scoreSprites.set(pipeId, sprite);
  }

  hideCandidateScores() {
    this.scoreSprites.forEach(sprite => {
      this.scene.remove(sprite);
    });
    this.scoreSprites.clear();
  }

  getAllInteractables() {
    return this.interactables;
  }

  getPipeWorldPosition(id) {
    const pipe = this.pipes.get(id);
    if (!pipe) return new THREE.Vector3();
    return pipe.curve.getPointAt(0.5);
  }

  update(delta) {
    // Animate pumps
    this.pumps.forEach(pump => {
      if (pump.rotor) {
        pump.rotor.rotation.y += delta * 3;
      }
    });

    // Subtle valve animations could go here
    const time = Date.now() * 0.001;
    this.valves.forEach(valve => {
      if (valve.indicator) {
        valve.indicator.material.opacity = 0.7 + Math.sin(time * 2) * 0.3;
      }
    });
  }
}
