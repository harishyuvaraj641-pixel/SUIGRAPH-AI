import * as THREE from 'three';

export class AISystem {
  constructor(scene, pipelineNetwork, sensorManager) {
    this.scene = scene;
    this.pipelineNetwork = pipelineNetwork;
    this.sensorManager = sensorManager;
    this.scoreSprites = [];
  }

  async runAnomalyDetection() {
    return new Promise((resolve) => {
      // Simulate processing time
      setTimeout(() => {
        this.sensorManager.triggerAnomaly('S-07');
        this.sensorManager.sendPulse('S-07');
        
        resolve({
          score: 0.94,
          status: 'ANOMALY_DETECTED',
          sensorId: 'S-07'
        });
      }, 1500);
    });
  }

  async runGNNLocalization() {
    return new Promise((resolve) => {
      this.pipelineNetwork.showGraphOverlay(true);
      
      setTimeout(() => {
        const scores = new Map([
          ['P-12', 0.18],
          ['P-14', 0.27],
          ['P-16', 0.41],
          ['P-17', 0.964],
          ['P-18', 0.22],
          ['P-15', 0.12]
        ]);
        
        resolve(scores);
        
        // After returning, P-17 should be highlighted as the winner
        this.pipelineNetwork.highlightPipe('P-17', new THREE.Color(0xff3344));
      }, 2000);
    });
  }

  showGraphAnalysis(show) {
    this.pipelineNetwork.showGraphOverlay(show);
    
    if (show) {
      // In a more complex implementation, we would create glowing connection lines between sensor nodes 
      // and their connected junctions and animate the edges appearing sequentially.
      // For this simplified version, we rely on the pipelineNetwork's implementation of showGraphOverlay.
    } else {
      // Fade out and hide
    }
  }

  showCandidateScores(scores) {
    scores.forEach((score, pipeId) => {
      const sprite = this.makeScoreSprite(pipeId, score);
      const position = this.pipelineNetwork.getPipeWorldPosition(pipeId);
      
      if (position) {
        sprite.position.copy(position);
        sprite.position.y += 1.5; // Position above the pipe
        
        sprite.scale.set(0, 0, 0); // Start at 0 scale for animation
        
        this.scene.add(sprite);
        this.scoreSprites.push(sprite);
        
        if (window.gsap) {
          window.gsap.to(sprite.scale, {
            x: 1.5,
            y: 0.75,
            z: 1,
            duration: 0.5,
            ease: "back.out(1.7)"
          });
        } else {
          sprite.scale.set(1.5, 0.75, 1);
        }
      }
    });
  }

  hideCandidateScores() {
    if (this.scoreSprites.length === 0) return;
    
    if (window.gsap) {
      this.scoreSprites.forEach(sprite => {
        window.gsap.to(sprite.scale, {
          x: 0,
          y: 0,
          z: 0,
          duration: 0.3,
          onComplete: () => {
            this.scene.remove(sprite);
            if (sprite.material.map) sprite.material.map.dispose();
            sprite.material.dispose();
          }
        });
      });
      setTimeout(() => {
        this.scoreSprites = [];
      }, 350);
    } else {
      this.scoreSprites.forEach(sprite => {
        this.scene.remove(sprite);
        if (sprite.material.map) sprite.material.map.dispose();
        sprite.material.dispose();
      });
      this.scoreSprites = [];
    }
  }

  makeScoreSprite(pipeId, score) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Background: semi-transparent dark rectangle
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.beginPath();
    ctx.roundRect(0, 0, 256, 128, 16);
    ctx.fill();

    // Text: Pipe ID
    ctx.font = '20px Share Tech Mono';
    ctx.fillStyle = '#00d4ff';
    ctx.textAlign = 'center';
    ctx.fillText(pipeId, 128, 40);

    // Text: Score
    ctx.font = 'bold 28px Orbitron';
    if (score > 0.8) {
      ctx.fillStyle = '#ff3344'; // red
    } else if (score > 0.5) {
      ctx.fillStyle = '#ffaa00'; // yellow
    } else {
      ctx.fillStyle = '#00ff88'; // green
    }
    const percent = (score * 100).toFixed(1) + '%';
    ctx.fillText(percent, 128, 90);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(1.5, 0.75, 1);
    
    // Custom property to animate hovering
    sprite.userData = { initialY: 0, offset: Math.random() * Math.PI * 2 };

    return sprite;
  }

  reset() {
    this.showGraphAnalysis(false);
    this.hideCandidateScores();
  }

  update(delta) {
    const time = performance.now() * 0.001;
    
    // Animate score sprites (gentle floating motion)
    this.scoreSprites.forEach(sprite => {
      if (sprite.userData.initialY === 0) {
        sprite.userData.initialY = sprite.position.y;
      }
      // Float up and down slightly
      sprite.position.y = sprite.userData.initialY + Math.sin(time * 2 + sprite.userData.offset) * 0.1;
    });
  }
}
