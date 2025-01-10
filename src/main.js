import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Load video as a texture
const video = document.createElement('video');
video.src = './video.mp4'; // Path to your video file
video.loop = true;
video.muted = true; // Initially muted
const videoTexture = new THREE.VideoTexture(video);

// Create a large plane with the video texture
const geometry = new THREE.PlaneGeometry(16, 9); // Aspect ratio of 16:9
const material = new THREE.MeshBasicMaterial({ map: videoTexture });
const plane = new THREE.Mesh(geometry, material);
scene.add(plane);

plane.position.set(0, 0, -54); // Position the plane as the background
plane.scale.set(5, 10, 5);
plane.rotateZ(99);

// Load GLB model
const loader = new GLTFLoader();
let model;
loader.load('./model.glb', function (gltf) {
  model = gltf.scene;
  model.scale.set(0.5, 0.5, 0.5); // Adjust the model size
  model.position.set(0, -55, -50); // Initial position of the model
  scene.add(model);
});

// Camera setup
camera.position.z = 3;

// Wait for a user interaction to start playing and unmute the video
document.body.addEventListener('click', () => {
  video.muted = false; // Unmute the video after user interaction
});
video.play();


// Animate the scene
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();