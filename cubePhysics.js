/* ==========================================================================
   VELOCITY X - BLACK CHROME FLOATING CUBES PHYSICS & INTERACTION
   "Black chrome cubes floating weightless in a bright studio — shove them aside, or grab one and fling it."
   ========================================================================== */

import * as THREE from 'three';
import { audioEngine } from './audioEngine.js';

export class CubePhysicsManager {
  constructor(scene, camera, domElement) {
    this.scene = scene;
    this.camera = camera;
    this.domElement = domElement;

    this.cubes = [];
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.plane = new THREE.Plane();
    this.planeIntersect = new THREE.Vector3();

    // Drag / Grab State
    this.draggedCube = null;
    this.dragPlanePoint = new THREE.Vector3();
    this.previousPosition = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.lastTime = 0;
    this.isMouseDown = false;

    // Materials - Mirror Black Chrome
    this.blackChromeMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a0a0c,
      metalness: 0.98,
      roughness: 0.05,
      envMapIntensity: 2.5
    });

    this.cubeGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);

    this.initEvents();
    this.spawnCubes(16);
  }

  spawnCubes(count = 16) {
    // Clear existing
    this.cubes.forEach(c => this.scene.remove(c.mesh));
    this.cubes = [];

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.cubeGeometry, this.blackChromeMaterial.clone());
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // Position floating around car
      const angle = (i / count) * Math.PI * 2;
      const radius = 3.5 + Math.random() * 3.5;
      const height = 0.8 + Math.random() * 3.2;

      mesh.position.set(
        Math.cos(angle) * radius + (Math.random() - 0.5) * 2,
        height,
        Math.sin(angle) * radius + (Math.random() - 0.5) * 2
      );

      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      const cubeObj = {
        mesh,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.01
        ),
        rotVelocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02
        ),
        baseHeight: height,
        floatPhase: Math.random() * Math.PI * 2,
        floatSpeed: 1 + Math.random() * 1.5,
        isGrabbed: false
      };

      this.cubes.push(cubeObj);
      this.scene.add(mesh);
    }
  }

  initEvents() {
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);

    this.domElement.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
  }

  updateMouseCoords(e) {
    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  onPointerDown(e) {
    this.updateMouseCoords(e);
    this.isMouseDown = true;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const meshes = this.cubes.map(c => c.mesh);
    const intersects = this.raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;
      const foundCube = this.cubes.find(c => c.mesh === hitMesh);

      if (foundCube) {
        this.draggedCube = foundCube;
        this.draggedCube.isGrabbed = true;

        // Set drag plane perpendicular to camera direction
        const cameraDir = new THREE.Vector3();
        this.camera.getWorldDirection(cameraDir);
        this.plane.setFromNormalAndCoplanarPoint(cameraDir.negate(), hitMesh.position);

        this.previousPosition.copy(hitMesh.position);
        this.lastTime = performance.now();
        this.velocity.set(0, 0, 0);

        audioEngine.playCubeClink(0.8);
      }
    }
  }

  onPointerMove(e) {
    this.updateMouseCoords(e);

    if (this.draggedCube && this.isMouseDown) {
      this.raycaster.setFromCamera(this.mouse, this.camera);
      if (this.raycaster.ray.intersectPlane(this.plane, this.planeIntersect)) {
        const now = performance.now();
        const dt = (now - this.lastTime) / 1000;

        if (dt > 0.001) {
          this.velocity.subVectors(this.planeIntersect, this.draggedCube.mesh.position).divideScalar(dt);
        }

        this.draggedCube.mesh.position.copy(this.planeIntersect);
        this.lastTime = now;
      }
    }
  }

  onPointerUp() {
    if (this.draggedCube) {
      this.draggedCube.isGrabbed = false;

      // Apply fling momentum!
      const flingSpeed = this.velocity.length();
      if (flingSpeed > 0.5) {
        this.draggedCube.velocity.copy(this.velocity).multiplyScalar(0.015);
        this.draggedCube.rotVelocity.set(
          (Math.random() - 0.5) * 0.3,
          (Math.random() - 0.5) * 0.3,
          (Math.random() - 0.5) * 0.3
        );
        audioEngine.playCubeClink(Math.min(1.0, flingSpeed / 10));
      }

      this.draggedCube = null;
    }
    this.isMouseDown = false;
  }

  flingBurst() {
    this.cubes.forEach(c => {
      const impulse = new THREE.Vector3(
        (Math.random() - 0.5) * 0.3,
        0.1 + Math.random() * 0.2,
        (Math.random() - 0.5) * 0.3
      );
      c.velocity.add(impulse);
      c.rotVelocity.set(
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2
      );
    });
    audioEngine.playCubeClink(0.9);
  }

  update(delta, time) {
    this.cubes.forEach(c => {
      if (!c.isGrabbed) {
        // Floating weightless sine wave
        c.floatPhase += delta * c.floatSpeed;
        const floatOffsetY = Math.sin(c.floatPhase) * 0.003;

        // Apply velocity decay (inertia damping in near zero-g studio)
        c.mesh.position.x += c.velocity.x;
        c.mesh.position.y += c.velocity.y + floatOffsetY;
        c.mesh.position.z += c.velocity.z;

        c.velocity.multiplyScalar(0.985); // air resistance

        // Rotation update
        c.mesh.rotation.x += c.rotVelocity.x;
        c.mesh.rotation.y += c.rotVelocity.y;
        c.mesh.rotation.z += c.rotVelocity.z;

        // Soft bounce off floor ground (y = 0.4)
        if (c.mesh.position.y < 0.4) {
          c.mesh.position.y = 0.4;
          c.velocity.y = Math.abs(c.velocity.y) * 0.6;
          audioEngine.playCubeClink(0.2);
        }

        // Soft bounce off ceiling / walls
        const maxDist = 8.0;
        if (c.mesh.position.length() > maxDist) {
          c.velocity.negate().multiplyScalar(0.7);
        }
      }
    });
  }

  dispose() {
    this.domElement.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
  }
}
