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

window.lastDetectedFace = null;
init();

// util functions

/** @type {WebGLRenderingContext} */
const canvasCtx = document.getElementById("canvas-preview").getContext('2d');
function previewFaceMesh(face, image) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, 400, 300);
    canvasCtx.drawImage(image, 0, 0, 400, 300);
    drawConnectors(canvasCtx, face, FACEMESH_TESSELATION, { color: '#C0C0C070', lineWidth: 1 });
    drawConnectors(canvasCtx, face, FACEMESH_RIGHT_EYE, { color: '#FF3030' });
    drawConnectors(canvasCtx, face, FACEMESH_RIGHT_EYEBROW, { color: '#FF3030' });
    drawConnectors(canvasCtx, face, FACEMESH_RIGHT_IRIS, { color: '#FF3030' });
    drawConnectors(canvasCtx, face, FACEMESH_LEFT_EYE, { color: '#30FF30' });
    drawConnectors(canvasCtx, face, FACEMESH_LEFT_EYEBROW, { color: '#30FF30' });
    drawConnectors(canvasCtx, face, FACEMESH_LEFT_IRIS, { color: '#30FF30' });
    drawConnectors(canvasCtx, face, FACEMESH_FACE_OVAL, { color: '#E0E0E0' });
    drawConnectors(canvasCtx, face, FACEMESH_LIPS, { color: '#E0E0E0' });
    drawConnectors(canvasCtx, face, [[8, 36], [36, 266], [266, 8]], { color: '#4287f555' });
}

function calculateFaceData(face) {
    let normal = calculateNormal(face[8], face[36], face[266]);
    window.faceXRotation = calculateAngle(normal.y, normal.z);
    window.faceYRotation = calculateAngle(normal.x, normal.z);
    window.faceZRotation = calculateAngle(face[266].y, face[36].y) * 4;
}

function calculateNormal(a, b, c) {
    let k = Vector.sub(b, a);
    let j = Vector.sub(c, a);
    let Nx = k.y * j.z - k.z * j.y;
    let Ny = k.z * j.x - k.x * j.z;
    let Nz = k.x * j.y - k.y * j.x;
    return { x: Nx, y: Ny, z: Nz }
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
    }
}
