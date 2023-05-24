// Define global variables
let video = null;
let canvas = null;
let context = null;
let faceCascade = null;
let src = null;
let gray = null;

// Run this after the DOM has loaded
document.addEventListener('DOMContentLoaded', (event) => {
    video = document.getElementById("video");
    canvas = document.getElementById("canvas");
    context = canvas.getContext("2d");
});

// Make sure the function is in the global scope
window.onOpenCvReady = function() {
    cv.onRuntimeInitialized = function() {
        loadFaceCascade();
    };
};

window.loadFaceCascade = function() {
    fetch("http://localhost:8000/static/haarcascades/haarcascade_frontalface_alt.xml")
        .then(response => response.text())
        .then(xmlString => {
            cv.FS_createDataFile('/', 'haarcascade_frontalface_alt.xml', xmlString, true, false);
            faceCascade = new cv.CascadeClassifier();
            faceCascade.load('/haarcascade_frontalface_alt.xml');
            startVideo();
        })
        .catch(error => {
            console.error('Failed to load haarcascade_frontalface_alt.xml: ', error);
        });
};


window.startVideo = function() {
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(function(stream) {
            video.srcObject = stream;
            src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
            gray = new cv.Mat(video.height, video.width, cv.CV_8UC1);
            requestAnimationFrame(processVideo);
        })
        .catch(function(err) {
            console.log("An error occurred: " + err);
        });
};

window.processVideo = function() {
    context.drawImage(video, 0, 0, video.width, video.height);
    src.data.set(context.getImageData(0, 0, video.width, video.height).data);
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    let faces = new cv.RectVector();
    let detectMultiScale = faceCascade.detectMultiScale(gray, faces);
    for (let i = 0; i < faces.size(); ++i) {
        let face = faces.get(i);
        context.strokeStyle = 'green';
        context.lineWidth = 2;
        context.rect(face.x, face.y, face.width, face.height);
        context.stroke();
    }
    requestAnimationFrame(processVideo);
};
