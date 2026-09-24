import * as THREE from 'three';

// ═══════════════════════════════════════════════════════
//  FlowSystem — Water particles flowing through pipes
// ═══════════════════════════════════════════════════════

export class FlowSystem {
  constructor(scene, pipelineNetwork) {
    this.scene = scene;
    this.pipelineNetwork = pipelineNetwork;
    this.anomalyPipeId = null;
    this.time = 0;

    // Particle allocation
    this.particlesPerPipe = 60;
    this.pipeIds = [...pipelineNetwork.pipes.keys()];
    this.totalParticles = this.pipeIds.length * this.particlesPerPipe;

    // Arrays to track each particle's pipe index and progress
    this.particlePipeIndex = new Int16Array(this.totalParticles);
    this.particleProgress = new Float32Array(this.totalParticles);
    this.particleSpeed = new Float32Array(this.totalParticles);

    // Create particle texture
    this.texture = this._createParticleTexture();

    // Build the Points mesh
    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.totalParticles * 3);
    this.colors = new Float32Array(this.totalParticles * 3);
    this.sizes = new Float32Array(this.totalParticles);

    // Initialize particles
    let idx = 0;
    for (let pi = 0; pi < this.pipeIds.length; pi++) {
      for (let j = 0; j < this.particlesPerPipe; j++) {
        this.particlePipeIndex[idx] = pi;
        this.particleProgress[idx] = Math.random();
        this.particleSpeed[idx] = 0.1 + Math.random() * 0.1; // 0.1–0.2

        // Initial color: cyan
        this.colors[idx * 3] = 0.0;
        this.colors[idx * 3 + 1] = 0.7;
        this.colors[idx * 3 + 2] = 1.0;

        this.sizes[idx] = 0.04 + Math.random() * 0.03;
        idx++;
      }
    }

    // Set initial positions
    this._updatePositions();

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.07,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      map: this.texture,
      sizeAttenuation: true,
    });

    this.points = new THREE.Points(this.geometry, material);
    scene.add(this.points);
  }

  _createParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.3, 'rgba(255,255,255,0.6)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(canvas);
  }

  _updatePositions() {
    for (let i = 0; i < this.totalParticles; i++) {
      const pi = this.particlePipeIndex[i];
      const pipeId = this.pipeIds[pi];
      const pipe = this.pipelineNetwork.pipes.get(pipeId);
      if (!pipe) continue;

      const t = this.particleProgress[i];
      try {
        const pos = pipe.curve.getPointAt(Math.max(0, Math.min(1, t)));
        this.positions[i * 3] = pos.x;
        this.positions[i * 3 + 1] = pos.y;
        this.positions[i * 3 + 2] = pos.z;
      } catch (e) {
        // Keep previous position on error
      }
    }
  }

  setAnomalyRegion(pipeId) {
    this.anomalyPipeId = pipeId;
    const anomalyPipeIndex = this.pipeIds.indexOf(pipeId);

    for (let i = 0; i < this.totalParticles; i++) {
      if (this.particlePipeIndex[i] === anomalyPipeIndex) {
        // Orange for anomaly
        this.colors[i * 3] = 1.0;
        this.colors[i * 3 + 1] = 0.4;
        this.colors[i * 3 + 2] = 0.0;
      }
    }
    this.geometry.attributes.color.needsUpdate = true;
  }

  clearAnomalyRegion() {
    this.anomalyPipeId = null;
    for (let i = 0; i < this.totalParticles; i++) {
      this.colors[i * 3] = 0.0;
      this.colors[i * 3 + 1] = 0.7;
      this.colors[i * 3 + 2] = 1.0;
    }
    this.geometry.attributes.color.needsUpdate = true;
  }

  update(delta) {
    this.time += delta;

    for (let i = 0; i < this.totalParticles; i++) {
      this.particleProgress[i] += this.particleSpeed[i] * delta;
      if (this.particleProgress[i] > 1) {
        this.particleProgress[i] -= 1;
      }
    }

    this._updatePositions();
    this.geometry.attributes.position.needsUpdate = true;
  }
}


// ═══════════════════════════════════════════════════════
//  LeakEffect — Pressurized water spray from pipe crack
// ═══════════════════════════════════════════════════════

export class LeakEffect {
  constructor(scene) {
    this.scene = scene;
    this.isActive = false;
    this.time = 0;
    this.meshes = [];

    this.particleCount = 250;
    this.mistCount = 80;

    // Preallocate particle data
    this.velocities = [];
    this.lives = new Float32Array(this.particleCount + this.mistCount);
    this.maxLives = new Float32Array(this.particleCount + this.mistCount);

    // Create particle texture
    this.texture = this._createTexture();
  }

  _createTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.4, 'rgba(255,255,255,0.5)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(canvas);
  }

  activate(position, direction) {
    if (this.isActive) this.deactivate();
    this.isActive = true;
    this.origin = position.clone();
    this.direction = direction.clone().normalize();
    this.time = 0;

    // ── Spray particles ──
    const totalCount = this.particleCount + this.mistCount;
    const sprayGeo = new THREE.BufferGeometry();
    this.sprayPositions = new Float32Array(totalCount * 3);
    this.sprayColors = new Float32Array(totalCount * 3);
    this.spraySizes = new Float32Array(totalCount);

    this.velocities = [];

    for (let i = 0; i < totalCount; i++) {
      const isMist = i >= this.particleCount;

      // Initialize at origin
      this.sprayPositions[i * 3] = this.origin.x;
      this.sprayPositions[i * 3 + 1] = this.origin.y;
      this.sprayPositions[i * 3 + 2] = this.origin.z;

      // Random velocity in a cone around direction
      const vel = this._randomConeVelocity(isMist);
      this.velocities.push(vel);

      // Life
      this.maxLives[i] = isMist ? 2.0 + Math.random() * 1.5 : 0.8 + Math.random() * 0.7;
      this.lives[i] = Math.random() * this.maxLives[i]; // stagger start

      // Color: cyan water
      this.sprayColors[i * 3] = 0.1;
      this.sprayColors[i * 3 + 1] = isMist ? 0.5 : 0.8;
      this.sprayColors[i * 3 + 2] = 1.0;

      // Size
      this.spraySizes[i] = isMist ? (0.15 + Math.random() * 0.25) : (0.04 + Math.random() * 0.04);
    }

    sprayGeo.setAttribute('position', new THREE.BufferAttribute(this.sprayPositions, 3));
    sprayGeo.setAttribute('color', new THREE.BufferAttribute(this.sprayColors, 3));
    sprayGeo.setAttribute('size', new THREE.BufferAttribute(this.spraySizes, 1));

    const sprayMat = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      map: this.texture,
      sizeAttenuation: true,
    });

    this.sprayMesh = new THREE.Points(sprayGeo, sprayMat);
    this.scene.add(this.sprayMesh);
    this.meshes.push(this.sprayMesh);

    // ── Warning glow light ──
    this.warningLight = new THREE.PointLight(0xff3344, 1.5, 6);
    this.warningLight.position.copy(this.origin);
    this.scene.add(this.warningLight);
    this.meshes.push(this.warningLight);

    // ── Pulsing rings ──
    this.rings = [];
    for (let r = 0; r < 3; r++) {
      const ringGeo = new THREE.TorusGeometry(0.1, 0.015, 8, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xff3344,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(this.origin);
      ringMesh.rotation.x = Math.PI / 2;
      this.scene.add(ringMesh);
      this.meshes.push(ringMesh);

      this.rings.push({
        mesh: ringMesh,
        mat: ringMat,
        phase: r * 0.5, // staggered
        cycleTime: 1.5,
      });
    }
  }

  _randomConeVelocity(isMist) {
    const spread = isMist ? 0.8 : 0.5;
    const speed = isMist ? (0.3 + Math.random() * 0.4) : (2.0 + Math.random() * 2.5);

    const vel = new THREE.Vector3(
      this.direction.x + (Math.random() - 0.5) * spread,
      this.direction.y + (Math.random() - 0.5) * spread * 0.6,
      this.direction.z + (Math.random() - 0.5) * spread
    ).normalize().multiplyScalar(speed);

    return vel;
  }

  deactivate() {
    if (!this.isActive) return;
    this.isActive = false;

    this.meshes.forEach(m => {
      this.scene.remove(m);
      if (m.geometry) m.geometry.dispose();
      if (m.material) {
        if (m.material.map) m.material.map.dispose();
        m.material.dispose();
      }
    });
    this.meshes = [];
    this.rings = [];
    this.sprayMesh = null;
    this.warningLight = null;
  }

  update(delta) {
    if (!this.isActive) return;
    this.time += delta;
    const totalCount = this.particleCount + this.mistCount;

    // Update particles
    for (let i = 0; i < totalCount; i++) {
      this.lives[i] -= delta;

      if (this.lives[i] <= 0) {
        // Respawn at origin
        this.sprayPositions[i * 3] = this.origin.x;
        this.sprayPositions[i * 3 + 1] = this.origin.y;
        this.sprayPositions[i * 3 + 2] = this.origin.z;

        const isMist = i >= this.particleCount;
        this.velocities[i] = this._randomConeVelocity(isMist);
        this.lives[i] = this.maxLives[i];
      } else {
        const vel = this.velocities[i];
        // Apply gravity
        vel.y -= 3.0 * delta;

        // Move
        this.sprayPositions[i * 3] += vel.x * delta;
        this.sprayPositions[i * 3 + 1] += vel.y * delta;
        this.sprayPositions[i * 3 + 2] += vel.z * delta;

        // Floor collision — particles stop at y=0
        if (this.sprayPositions[i * 3 + 1] < 0.01) {
          this.sprayPositions[i * 3 + 1] = 0.01;
          vel.y *= -0.2;
          vel.x *= 0.8;
          vel.z *= 0.8;
        }
      }

      // Fade color based on remaining life
      const lifeRatio = this.lives[i] / this.maxLives[i];
      const isMist = i >= this.particleCount;
      this.sprayColors[i * 3 + 0] = isMist ? 0.2 : (0.1 + (1 - lifeRatio) * 0.4);
      this.sprayColors[i * 3 + 1] = isMist ? (0.4 * lifeRatio) : (0.8 * lifeRatio);
      this.sprayColors[i * 3 + 2] = lifeRatio;
    }

    if (this.sprayMesh) {
      this.sprayMesh.geometry.attributes.position.needsUpdate = true;
      this.sprayMesh.geometry.attributes.color.needsUpdate = true;
    }

    // Pulse warning light
    if (this.warningLight) {
      this.warningLight.intensity = 1.0 + Math.sin(this.time * 8) * 0.8;
    }

    // Expand and reset rings
    this.rings.forEach(ring => {
      const cycle = ((this.time + ring.phase) % ring.cycleTime) / ring.cycleTime;
      const scale = 1 + cycle * 4;
      ring.mesh.scale.setScalar(scale);
      ring.mat.opacity = 0.6 * (1 - cycle);
    });
  }
}
