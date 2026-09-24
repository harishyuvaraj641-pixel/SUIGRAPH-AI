import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export class World {
  constructor(container) {
    this.container = container;

    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060a12);
    this.scene.fog = new THREE.FogExp2(0x060a12, 0.008);

    // Clock
    this.clock = new THREE.Clock();

    // Camera setup
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 500);
    this.camera.position.set(25, 22, 30);

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 80;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05;
    this.controls.target.set(0, 0, 2);
    this.controls.update();

    this.setupLighting();
    this.setupEnvironment();
    this.setupPostProcessing();

    // Resize event
    this.onResize = this.resize.bind(this);
    window.addEventListener('resize', this.onResize);
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0x2a4a6a, 1.0);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(20, 30, 15);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 100;
    dirLight.shadow.camera.left = -30;
    dirLight.shadow.camera.right = 30;
    dirLight.shadow.camera.top = 30;
    dirLight.shadow.camera.bottom = -30;
    dirLight.shadow.bias = -0.0001;
    this.scene.add(dirLight);

    // Secondary fill light from opposite side
    const dirLight2 = new THREE.DirectionalLight(0x8899bb, 0.5);
    dirLight2.position.set(-15, 20, -10);
    this.scene.add(dirLight2);

    const hemiLight = new THREE.HemisphereLight(0x3a5a8a, 0x1a1a2a, 0.5);
    this.scene.add(hemiLight);

    // Cyan point lights for industrial atmosphere
    const pointLight1 = new THREE.PointLight(0x00ddff, 1.5, 60);
    pointLight1.position.set(15, 8, -10);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x00ddff, 1.2, 60);
    pointLight2.position.set(-15, 8, 10);
    this.scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0x00aacc, 1.0, 50);
    pointLight3.position.set(0, 6, 0);
    this.scene.add(pointLight3);

    const pointLight4 = new THREE.PointLight(0x0088aa, 0.8, 40);
    pointLight4.position.set(0, 5, 16);
    this.scene.add(pointLight4);
  }

  setupEnvironment() {
    // Floor
    const floorGeometry = new THREE.PlaneGeometry(200, 200);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x080c15,
      roughness: 0.8,
      metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Grid
    const grid = new THREE.GridHelper(60, 60, 0x0a1520, 0x0a1520);
    grid.position.y = 0.01; // slightly above floor to prevent z-fighting
    this.scene.add(grid);

    // Random platforms/supports
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    const boxMaterial = new THREE.MeshStandardMaterial({ color: 0x111622 });
    
    const positions = [
      { p: [10, 1, 5], s: [4, 2, 4] },
      { p: [-8, 2, -12], s: [3, 4, 3] },
      { p: [5, 0.5, 15], s: [6, 1, 2] }
    ];

    positions.forEach(pos => {
      const box = new THREE.Mesh(boxGeometry, boxMaterial);
      box.position.set(pos.p[0], pos.p[1], pos.p[2]);
      box.scale.set(pos.s[0], pos.s[1], pos.s[2]);
      box.castShadow = true;
      box.receiveShadow = true;
      this.scene.add(box);
    });
  }

  setupPostProcessing() {
    const renderScene = new RenderPass(this.scene, this.camera);
    
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.6,  // strength
      0.4,  // radius
      0.85  // threshold
    );

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(renderScene);
    this.composer.addPass(this.bloomPass);
  }

  resize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);
  }

  render() {
    this.controls.update();
    this.composer.render();
  }

  focusOn(position, lookAt, duration = 1.5) {
    if (!window.gsap) return;

    this.controls.enabled = false;

    window.gsap.to(this.camera.position, {
      x: position.x,
      y: position.y,
      z: position.z,
      duration: duration,
      ease: 'power2.inOut',
      onUpdate: () => {
        // Not strictly necessary since controls.target handles lookAt, 
        // but helps keep things smooth if needed.
        this.camera.lookAt(this.controls.target);
      }
    });

    window.gsap.to(this.controls.target, {
      x: lookAt.x,
      y: lookAt.y,
      z: lookAt.z,
      duration: duration,
      ease: 'power2.inOut',
      onComplete: () => {
        this.controls.enabled = true;
      }
    });
  }

  resetCamera(duration = 1.5) {
    const initialPosition = new THREE.Vector3(25, 22, 30);
    const initialTarget = new THREE.Vector3(0, 0, 2);
    this.focusOn(initialPosition, initialTarget, duration);
  }
}
