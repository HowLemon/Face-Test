async function init() {
    const videoElement = document.getElementById("video-player");
    const faceMesh = await new FaceMesh({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
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
            let normal = calculateNormal(face[8],face[352],face[123]);
            window.faceXRotation = euler_angle(normal.y,normal.z);
            window.faceYRotation = euler_angle(normal.x,normal.z);
            window.faceZRotation = euler_angle(face[352].y,face[123].y) * 2;
        }
    }
}

init();


// util functions

function calculateNormal(a, b, c) {
    let k = Vector.sub(b,a);
    let j = Vector.sub(c,a);
    let Nx = k.y * j.z - k.z * j.y;
    let Ny = k.z * j.x - k.x * j.z;
    let Nz = k.x * j.y - k.y * j.x;
    return { x: Nx, y: Ny, z: Nz }
}

function euler_angle(x,y) { 
    var rad = Math.atan(y/x);   // arcus tangent in radians
    if (x<0) rad += Math.PI;
    rad += (Math.PI / 2) * 3;
    return rad;
}

const Vector = {
    sub : (b, a)=>{
        return {x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
    }
}

