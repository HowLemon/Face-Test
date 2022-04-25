// camera control
const cameraSelect = document.getElementById("camera-source");
const videoPlayer = document.getElementById("video-player");

const MediaStreamHelper = {
    // Property of the object to store the current stream
    _stream: null,
    // This method will return the promise to list the real devices
    getDevices: function () {
        return navigator.mediaDevices.enumerateDevices();
    },
    // Request user permissions to access the camera and video
    requestStream: function () {
        if (this._stream) {
            this._stream.getTracks().forEach(track => {
                track.stop();
            });
        }

        const videoSource = cameraSelect.value;
        const constraints = {
            video: {
                deviceId: videoSource ? { exact: videoSource } : undefined,
                height: 480
            }
        };

        return navigator.mediaDevices.getUserMedia(constraints);
    }
};

MediaStreamHelper.requestStream().then(function (stream) {
    MediaStreamHelper._stream = stream;
    
    videoPlayer.srcObject = stream;

    MediaStreamHelper.getDevices().then((devices) => {
        devices.forEach((device) => {
            let option = new Option();
            option.value = device.deviceId;
            if (device.kind == "videoinput") {
                option.text = device.label || `Camera ${cameraSelect.length + 1}`;
                cameraSelect.appendChild(option);
            }
            console.log(device);
            cameraSelect.selectedIndex = [...cameraSelect.options].findIndex(option => option.text === stream.getVideoTracks()[0].label);
        })
    })
    
}).catch((err) => {
    console.error(err);
})

cameraSelect.onchange = ()=>{
    MediaStreamHelper.requestStream().then(function(stream){
        MediaStreamHelper._stream = stream;
        videoPlayer.srcObject = stream;
    })
}