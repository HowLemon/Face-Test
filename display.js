import * as THREE from 'three';
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();

const loader = new THREE.TextureLoader();
loader.setPath('');
const textureCube = loader.load(
    ['face.png']
)
const textureCube2 = loader.load(
    ['blank.png']
)
const material = [
    new THREE.MeshPhongMaterial({ color: 0x00ff00, map: textureCube2,shininess:100 }),
    new THREE.MeshPhongMaterial({ color: 0x00ff00, map: textureCube2,shininess:100 }),
    new THREE.MeshPhongMaterial({ color: 0x00ff00, map: textureCube2,shininess:100 }),
    new THREE.MeshPhongMaterial({ color: 0x00ff00, map: textureCube2,shininess:100 }),
    new THREE.MeshPhongMaterial({ color: 0x00ff00, map: textureCube,shininess:100 }),
    new THREE.MeshPhongMaterial({ color: 0x00ff00, map: textureCube2,shininess:100 })
];


renderer.setClearColor(new THREE.Color(0xffffff))
renderer.setSize(200, 200);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const light = new THREE.DirectionalLight(0xffffff, 1, 100);
light.position.set(-1, 1, 1);
light.castShadow = true;
scene.add(light);

const ambientLight = new THREE.AmbientLight(0x404040, 2); // soft white light
scene.add(ambientLight);

document.getElementById("display").appendChild(renderer.domElement);

const geometry = new THREE.BoxGeometry();

const cube = new THREE.Mesh(geometry, material);
cube.castShadow = true;
cube.receiveShadow = true;
const cubeRoot = new THREE.Group();
cubeRoot.add(cube);
scene.add(cubeRoot);

camera.position.z = 2;
window.faceXRotation = 0;
window.faceYRotation = 0;
window.faceZRotation = 0;

window.faceXOffset = 0;
window.faceYOffset = 0;
window.faceZOffset = 0;

let parameterDisplay = document.getElementById("parameters");

function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x = (window.faceXRotation - window.faceXOffset);
    cube.rotation.y = (window.faceYRotation - window.faceYOffset);
    cubeRoot.rotation.z = (window.faceZRotation - window.faceZOffset);
    parameterDisplay.innerHTML = `
    x:${window.faceXRotation}
    y:${window.faceYRotation}
    z:${window.faceZRotation}
    offX:${window.faceXOffset}
    offY:${window.faceYOffset}
    offZ:${window.faceZOffset}
    Mouthopen:${window.faceMouthOpen}
    Eye L:${window.EyeOpenL}
    Eye R:${window.EyeOpenR}
    Tranformed X:
    `
    renderer.render(scene, camera);

}



animate();