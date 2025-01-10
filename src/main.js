import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as posenet from '@tensorflow-models/posenet';
import * as tf from '@tensorflow/tfjs';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Load video as a texture
const video = document.createElement('video');
video.src = './video.mp4'; // Path to your video file
video.width = 640; // width of the video in pixels
video.height = 480; // height of the video in pixels
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

// Load GLB model
const loader = new GLTFLoader();
let model;
loader.load('./model.glb', function (gltf) {
  model = gltf.scene;
  model.scale.set(0.5, 0.5, 0.5); // Adjust the model size
  model.position.set(0, -55, -53); // Initial position of the model
  scene.add(model);
});

// Camera setup
camera.position.z = 3;

// Load PoseNet model
let net;
async function loadPoseNet() {
  net = await posenet.load();
  console.log('PoseNet model loaded!');
}
loadPoseNet();

// Perform pose estimation on video frame
async function estimatePose() {
  if (net && video.readyState === 4) {
    // Estimate pose from the video
    const pose = await net.estimateSinglePose(video, {
      flipHorizontal: false,
    });
    const minScoreThreshold = 0.3;  // Set a lower threshold value

// Filter keypoints based on the minimum score threshold
    const filteredKeypoints = pose.keypoints.filter(kp => kp.score >= minScoreThreshold);
    const allKeypoints = pose.keypoints.filter(kp => kp.score >= minScoreThreshold);

    // Use pose data to perform actions, e.g., move the model based on detected pose
    console.log(pose);

    // Example: Move the model based on the position of the left wrist (index 9)
    if (pose.keypoints[9].score > 0.5) {  // If the left wrist is detected with a confidence score above 0.5
      model.position.x = pose.keypoints[9].position.x / window.innerWidth * 10 - 5; // Map to 3D space
    }
  }

  requestAnimationFrame(estimatePose); // Continuously estimate pose
}

// Wait for user interaction to unmute video
document.body.addEventListener('click', () => {
  video.muted = false;
});

// Start video playback
video.play();

// Animate the scene
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// Start pose estimation
estimatePose();