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

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft light
scene.add(ambientLight);

plane.position.set(0, 0, -54); // Position the plane as the background
plane.scale.set(5, 10, 5);

// Load GLB model
const loader = new GLTFLoader();
let model;
loader.load('./model.glb', function (gltf) {
  model = gltf.scene;
  model.scale.set(5, 5, 5); // Adjust the model size
  model.position.set(0, -1, -5); // Initial position of the model
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
let lastPoseEstimationTime = 0; // Track the last time pose estimation was run
const debounceInterval = 100; // 1 second debounce interval

async function estimatePose() {
  const currentTime = Date.now();
  if (currentTime - lastPoseEstimationTime < debounceInterval) {
    // If the last pose estimation was less than 1 second ago, skip this call
    requestAnimationFrame(estimatePose);
    return;
  }

  lastPoseEstimationTime = currentTime; // Update last run time

  if (net && video.readyState === 4) {
    // Estimate pose from the video
    const pose = await net.estimateSinglePose(video, {
      flipHorizontal: false,
    });
    const minScoreThreshold = 0.03;  // Set a lower threshold value
    const filteredKeypoints = pose.keypoints.filter(kp => kp.score >= minScoreThreshold);

    // Use pose data to perform actions, e.g., move the model based on detected pose
    

    // Example: Map keypoints to 3D model bones
    // if (model) {
    //   const bones = model.getObjectByName('Armature')?.children; 
    //   if (!bones) return;

    //   // Iterate through filtered keypoints and update corresponding bones
    //   filteredKeypoints.forEach(keypoint => {
    //     const bone = bones.find(bone => bone.name.toLowerCase() === keypoint.part.toLowerCase());

    //     if (bone && keypoint.score > 0.025) {
    //       // Map 2D position to 3D (assuming you want a 1:1 scale in this example)
    //       bone.position.x = keypoint.position.x / window.innerWidth * 10 - 5;  // Map to 3D space
    //       bone.position.y = -keypoint.position.y / window.innerHeight * 10 + 5; // Invert Y for 3D space
    //       bone.position.z = 0; // You can map this as needed
    //     }
    //   });
    // }
    model.traverse((child) => {
      if (child.isBone) console.error(child.name);
      if (child.isBone && child.name === 'LowerArmL_1') {
        const keypoint = filteredKeypoints.find(kp => kp.part === 'leftWrist'); // Example for left wrist
        if (keypoint) {
          child.position.x = (keypoint.position.y / window.innerHeight) * 0.9;
          child.position.y = (keypoint.position.x / window.innerWidth) * 0.9;
          child.position.z = -5;
        }
      } else if (child.isBone && child.name === 'UpperLegR') {
          const keypoint = filteredKeypoints.find(kp => kp.part === 'rightHip'); // Example for left wrist
          if (keypoint) {
            child.position.x = (keypoint.position.y / window.innerHeight) * 0.9;
            child.position.y = (keypoint.position.x / window.innerWidth) * 0.9;
            child.position.z = -5;
          }
      } else if (child.isBone && child.name === 'LowerLegR') {
        const keypoint = filteredKeypoints.find(kp => kp.part === 'leftKnee'); // Example for left wrist
        if (keypoint) {
          child.position.x = (keypoint.position.y / window.innerHeight) * 0.9;
          child.position.y = (keypoint.position.x / window.innerWidth) * 0.9;
          child.position.z = -5;
        }
      } else if (child.isBone && child.name === 'FootR') {
        const keypoint = filteredKeypoints.find(kp => kp.part === 'leftAnkle'); // Example for left wrist
        if (keypoint) {
          child.position.x = (keypoint.position.y / window.innerHeight) * 0.9;
          child.position.y = (keypoint.position.x / window.innerWidth) * 0.9;
          child.position.z = -5;
        }
      }
    });
    
    if (pose.keypoints[9].score > 0.025) {  // If the left wrist is detected with a confidence score above 0.5
      model.position.x = pose.keypoints[9].position.x / window.innerWidth * 10 - 5; // Map to 3D space
      model.position.y = pose.keypoints[9].position.y / window.innerWidth * 10 - 5; // Map to 3D space
      const bone2 = model.getObjectByName('Armature')?.children[3];
      bone2.position.y = bone2.position.y + 1;
    }

    // Request next animation frame for continuous pose estimation
    requestAnimationFrame(estimatePose);
  }
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
  estimatePose();
}
animate();

// Start pose estimation