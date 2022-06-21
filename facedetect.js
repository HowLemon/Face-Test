import { OneEuroFilter } from "./OneEuroFilter.js";

async function init() {
    let calibrated = false;
    const videoElement = document.getElementById("video-player");
    const faceMesh = await new FaceMesh({
        locateFile: (file) => {
            return `assets/${file}`;
        }
    });

    console.log("face model loaded")


    faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    faceMesh.onResults(onDetectedFace);

    async function sendVideoElement(stream) {
        try {
            await faceMesh.send({ image: videoElement });
        } catch (err) {
            console.error("sendVideoElement", err);
        }
        let callback = () => {
            sendVideoElement(stream);
        }
        if (stream.active) requestAnimationFrame(callback);
    }
    // sendVideoElement();
    videoElement.onloadeddata = () => {
        let stream = videoElement.captureStream();
        sendVideoElement(stream);
    }
    // facedetect 
    function onDetectedFace(results) {
        const face = results.multiFaceLandmarks[0] || null;
        if (face) {
            window.lastDetectedFace = face;
            window.lastDetectedFaceImage = results.image;
            notifyDetectedFace();
            calculateFaceData(face);
            previewFaceMesh(face, results.image);
            if (!calibrated) {
                window.faceXOffset = window.faceXRotation;
                window.faceYOffset = window.faceYRotation;
                window.faceZOffset = window.faceZRotation;
                calibrated = true;
            }
        }
    }
}

let lastTime = 0;
let fpsCounter = document.getElementById("fps");
let smoother = [0, 0, 0, 0, 0, 0, 0, 0, 0]
function notifyDetectedFace() {
    let diff = (Date.now() - lastTime);
    smoother.unshift(diff);
    smoother.pop();
    try {
        fpsCounter.innerHTML = 1000 / (smoother.reduce((a, b) => a + b, 0) / smoother.length);
    } catch {

    }

    lastTime = Date.now();
}

window.lastDetectedFace = null;
init();

// util functions

/** @type {WebGLRenderingContext} */
const canvasCtx = document.getElementById("canvas-preview").getContext('2d');
async function previewFaceMesh(face, image) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, 400, 300);
    canvasCtx.drawImage(image, 0, 0, 400, 300);
    drawConnectors(canvasCtx, face, FACEMESH_TESSELATION, { color: '#C0C0C070', lineWidth: 1 });
    drawConnectors(canvasCtx, face, FACEMESH_RIGHT_EYE, { color: '#FF3030' });
    drawConnectors(canvasCtx, face, FACEMESH_RIGHT_EYEBROW, { color: '#FF3030' });
    drawConnectors(canvasCtx, face, FACEMESH_RIGHT_IRIS, { color: '#FF3030' });
    drawConnectors(canvasCtx, face, FACEMESH_LEFT_EYE, { color: '#30FF30' });
    drawConnectors(canvasCtx, face, [[468, 469]], { color: '#30FF30' });
    drawConnectors(canvasCtx, face, FACEMESH_LEFT_EYEBROW, { color: '#30FF30' });
    drawConnectors(canvasCtx, face, FACEMESH_LEFT_IRIS, { color: '#30FF30' });
    drawConnectors(canvasCtx, face, FACEMESH_FACE_OVAL, { color: '#E0E0E0' });
    drawConnectors(canvasCtx, face, FACEMESH_LIPS, { color: '#E0E0E0' });
    drawConnectors(canvasCtx, face, [[8, 36], [36, 266], [266, 8]], { color: '#4287f555' });
}
const filterLength = 10
window.sampleRate = 16
window.cutoff = 22050;
window.leftEyeVectorOffset = { x: 0, y: 0, z: 0 };
window.rightEyeVectorOffset = { x: 0, y: 0, z: 0 };
const faceXArray = Array(filterLength).fill(0);
const faceYArray = Array(filterLength).fill(0);
const faceZArray = Array(filterLength).fill(0);



console.log(faceXArray, faceYArray, faceZArray)

function calculateFaceData(face) {
    let normal = calculateNormal(face[8], face[36], face[266]);



    let scale = distanceVector(face[36], face[266]);
    let mouthOpen = distanceVector(face[13], face[14]) / scale;
    let leyeOpen = distanceVector(face[159], face[145]) / scale;
    let reyeOpen = distanceVector(face[386], face[374]) / scale;

    let leftIris = face[473];
    let rightIris = face[468];
    let leftEyeCenter = FACEMESH_LEFT_EYE.map(e => lastDetectedFace[e[0]])
        .reduce((p, c) => {
            return { x: p.x + c.x / FACEMESH_LEFT_EYE.length, y: p.y + c.y * scale / (FACEMESH_LEFT_EYE.length), z: p.z + c.z * scale / (FACEMESH_LEFT_EYE.length) };
        }, ({ x: 0, y: 0, z: 0 }))
    let rightEyeCenter = FACEMESH_LEFT_EYE.map(e => lastDetectedFace[e[0]])
        .reduce((p, c) => {
            return { x: p.x + c.x / FACEMESH_RIGHT_EYE.length, y: p.y + c.y * scale / (FACEMESH_LEFT_EYE.length), z: p.z + c.z * scale / (FACEMESH_LEFT_EYE.length) };
        }, ({ x: 0, y: 0, z: 0 }))
    window.leftEyeVector = Vector.sub(leftIris, leftEyeCenter);
    window.rightEyeVector = Vector.sub(rightIris, rightEyeCenter);

    leyeOpen = leyeOpen * 10 - 1;
    reyeOpen = reyeOpen * 10 - 1;

    // if (leyeOpen > 0.3) {
    //     leyeOpen = 1
    // } else {
    //     leyeOpen = 0
    // }

    // if (reyeOpen > 0.3) {
    //     reyeOpen = 1
    // } else {
    //     reyeOpen = 0
    // }


    faceXArray.shift()
    faceYArray.shift()
    faceZArray.shift()

    faceXArray.push(calculateAngle(normal.y, normal.z));
    faceYArray.push(calculateAngle(normal.x, normal.z));
    faceZArray.push(calculateAngle(face[266].y, face[36].y) * 4);
    if (window.filter) {
        // console.log(faceXArray, faceYArray, faceZArray)
        // let faceXArraySnapshot = faceXArray.slice();
        // let faceYArraySnapshot = faceYArray.slice();
        // let faceZArraySnapshot = faceZArray.slice();

        // lowPassFilter.lowPassFilter(faceXArraySnapshot, window.cutoff, window.sampleRate, 1);
        // lowPassFilter.lowPassFilter(faceYArraySnapshot, window.cutoff, window.sampleRate, 1);
        // lowPassFilter.lowPassFilter(faceZArraySnapshot, window.cutoff, window.sampleRate, 1);
        // console.log(faceXArraySnapshot);

        // window.faceXRotation = faceXArraySnapshot[5];
        // window.faceYRotation = faceYArraySnapshot[5];
        // window.faceZRotation = faceZArraySnapshot[5];
    } else {
        window.faceXRotation = faceXArray.at(-1)
        window.faceYRotation = faceYArray.at(-1)
        window.faceZRotation = faceZArray.at(-1)
    }

    window.faceMouthOpen = mouthOpen;
    window.EyeOpenL = leyeOpen;
    window.EyeOpenR = reyeOpen;

}

function calculateNormal(a, b, c) {
    let k = Vector.sub(b, a);
    let j = Vector.sub(c, a);
    let Nx = k.y * j.z - k.z * j.y;
    let Ny = k.z * j.x - k.x * j.z;
    let Nz = k.x * j.y - k.y * j.x;
    return { x: Nx, y: Ny, z: Nz }
}

function distanceVector(v1, v2) {
    var dx = v1.x - v2.x;
    var dy = v1.y - v2.y;
    var dz = v1.z - v2.z;

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function calculateAngle(x, y) {
    var rad = Math.atan(y / x);   // arcus tangent in radians
    if (x < 0) rad += Math.PI;
    rad += (Math.PI / 2) * 3;
    return rad;
}

const Vector = {
    sub: (b, a) => {
        return { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
    },
    add: (b, a) => {
        return { x: b.x + a.x, y: b.y + a.y, z: b.z + a.z };
    }
}

