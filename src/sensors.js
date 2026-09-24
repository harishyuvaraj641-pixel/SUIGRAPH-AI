import * as THREE from 'three';

// ═══════════════════════════════════════════════════════
//  SensorManager — 3D IoT sensor objects on the pipeline
// ═══════════════════════════════════════════════════════

export class SensorManager {
  constructor(scene, networkData, pipelineNetwork) {
    this.scene = scene;
    this.networkData = networkData;
    this.pipelineNetwork = pipelineNetwork;
    this.sensors = new Map();
    this.pulses = [];
    this.time = 0;

    this._buildSensors();
  }

  _buildSensors() {
    this.networkData.sensors.forEach(sensorDef => {
      const pipe = this.pipelineNetwork.pipes.get(sensorDef.pipeId);
      if (!pipe) return;

      // Position sensor at pipe midpoint
      const t = 0.5;
      const position = pipe.curve.getPointAt(t);
      const tangent = pipe.curve.getTangentAt(t).normalize();

      // Offset perpendicular to pipe (outward)
      const up = new THREE.Vector3(0, 1, 0);
      const outward = new THREE.Vector3().crossVectors(tangent, up).normalize();
      if (outward.length() < 0.1) outward.set(1, 0, 0);
      const sensorPos = position.clone().add(outward.multiplyScalar(0.35));
      sensorPos.y += 0.15;

      // Create sensor group
      const group = new THREE.Group();
      group.position.copy(sensorPos);

      // Sensor body — small industrial IoT box
      const bodyGeo = new THREE.BoxGeometry(0.28, 0.18, 0.18);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x1a2535,
        metalness: 0.6,
        roughness: 0.4,
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      group.add(body);

      // Mounting bracket
      const bracketGeo = new THREE.BoxGeometry(0.06, 0.04, 0.25);
      const bracketMat = new THREE.MeshStandardMaterial({ color: 0x2a3545, metalness: 0.7 });
      const bracket = new THREE.Mesh(bracketGeo, bracketMat);
      bracket.position.set(-0.17, 0, 0);
      group.add(bracket);

      // Glowing ring
      const ringGeo = new THREE.TorusGeometry(0.18, 0.02, 8, 24);
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0x003344,
        emissive: 0x00d4ff,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.9,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.12;
      group.add(ring);

      // Status LED
      const ledGeo = new THREE.SphereGeometry(0.04, 8, 8);
      const ledMat = new THREE.MeshStandardMaterial({
        color: 0x00ff88,
        emissive: 0x00ff88,
        emissiveIntensity: 0.8,
      });
      const led = new THREE.Mesh(ledGeo, ledMat);
      led.position.set(0, 0.13, 0.08);
      group.add(led);

      // Orient group to face outward from pipe
      group.lookAt(position);

      // UserData for raycasting
      const userData = { type: 'sensor', id: sensorDef.id };
      group.userData = userData;
      body.userData = userData;

      this.scene.add(group);

      this.sensors.set(sensorDef.id, {
        group,
        body,
        ring,
        ringMat,
        led,
        ledMat,
        data: { ...sensorDef, position: sensorPos.toArray() },
        state: 'NORMAL', // NORMAL | WARNING | CRITICAL
        phaseOffset: Math.random() * Math.PI * 2,
      });
    });
  }

  getSensor(id) {
    return this.sensors.get(id);
  }

  triggerAnomaly(sensorId) {
    const sensor = this.sensors.get(sensorId);
    if (!sensor) return;

    sensor.state = 'CRITICAL';

    // Change LED to red
    sensor.ledMat.color.setHex(0xff3344);
    sensor.ledMat.emissive.setHex(0xff3344);

    // Change ring emissive to red
    sensor.ringMat.emissive.setHex(0xff3344);
    sensor.ringMat.color.setHex(0x331111);
  }

  sendPulse(sensorId) {
    const sensor = this.sensors.get(sensorId);
    if (!sensor) return;

    const pipe = this.pipelineNetwork.pipes.get(sensor.data.pipeId);
    if (!pipe) return;

    // Create a glowing pulse sphere
    const pulseGeo = new THREE.SphereGeometry(0.12, 12, 12);
    const pulseMat = new THREE.MeshStandardMaterial({
      color: 0x00d4ff,
      emissive: 0x00d4ff,
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 1.0,
    });
    const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
    pulseMesh.position.copy(sensor.group.position);
    this.scene.add(pulseMesh);

    // Pulse travels along the pipe curve in both directions
    this.pulses.push({
      mesh: pulseMesh,
      mat: pulseMat,
      curve: pipe.curve,
      progress: 0.5,
      speed: 0.4,
      direction: 1,
      life: 1.0,
    });

    // Second pulse going the other direction
    const pulseMesh2 = pulseMesh.clone();
    const pulseMat2 = pulseMat.clone();
    pulseMesh2.material = pulseMat2;
    this.scene.add(pulseMesh2);
    this.pulses.push({
      mesh: pulseMesh2,
      mat: pulseMat2,
      curve: pipe.curve,
      progress: 0.5,
      speed: 0.4,
      direction: -1,
      life: 1.0,
    });
  }

  resetAll() {
    this.sensors.forEach(sensor => {
      sensor.state = 'NORMAL';
      sensor.ledMat.color.setHex(0x00ff88);
      sensor.ledMat.emissive.setHex(0x00ff88);
      sensor.ringMat.emissive.setHex(0x00d4ff);
      sensor.ringMat.color.setHex(0x003344);
    });

    // Remove active pulses
    this.pulses.forEach(p => {
      this.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      p.mat.dispose();
    });
    this.pulses = [];
  }

  getAllInteractables() {
    const meshes = [];
    this.sensors.forEach(sensor => {
      meshes.push(sensor.body);
    });
    return meshes;
  }

  update(delta) {
    this.time += delta;

    // Animate sensor rings and LEDs
    this.sensors.forEach(sensor => {
      const t = this.time + sensor.phaseOffset;

      switch (sensor.state) {
        case 'NORMAL':
          sensor.ringMat.emissiveIntensity = 0.2 + 0.3 * Math.sin(t * Math.PI);
          break;
        case 'WARNING':
          sensor.ringMat.emissiveIntensity = 0.3 + 0.5 * Math.sin(t * Math.PI * 2);
          break;
        case 'CRITICAL':
          sensor.ringMat.emissiveIntensity = 0.3 + 0.7 * Math.abs(Math.sin(t * Math.PI * 5));
          // LED blink
          sensor.led.visible = Math.sin(t * 12) > 0;
          break;
      }
    });

    // Animate pulses
    for (let i = this.pulses.length - 1; i >= 0; i--) {
      const pulse = this.pulses[i];
      pulse.progress += pulse.speed * delta * pulse.direction;
      pulse.life -= delta * 0.5;

      // Clamp progress
      const p = Math.max(0, Math.min(1, pulse.progress));

      try {
        const pos = pulse.curve.getPointAt(p);
        pulse.mesh.position.copy(pos);
        pulse.mesh.position.y += 0.1;
      } catch (e) {
        // Curve evaluation failed, remove pulse
        pulse.life = 0;
      }

      pulse.mat.opacity = Math.max(0, pulse.life);
      pulse.mesh.scale.setScalar(0.8 + (1 - pulse.life) * 0.5);

      if (pulse.life <= 0 || p <= 0 || p >= 1) {
        this.scene.remove(pulse.mesh);
        pulse.mesh.geometry.dispose();
        pulse.mat.dispose();
        this.pulses.splice(i, 1);
      }
    }
  }
}
