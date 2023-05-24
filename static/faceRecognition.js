// Define global variables
let video = null;
let canvas = null;
let context = null;
let faceCascade = null;
let src = null;
let gray = null;
let startTime = null;
let circleX = null;
let circleY = null;
const circleRadius = 150;  // Adjust this to fit your needs
const requiredTime = 10000;  // 10 seconds

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
            circleX = video.width / 2;
            circleY = video.height / 2;
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

    // Draw circle
    context.beginPath();
    context.arc(circleX, circleY, circleRadius, 0, 2 * Math.PI);
    context.strokeStyle = 'blue';
    context.lineWidth = 2;
    context.stroke();

    // Check each detected face
    for (let i = 0; i < faces.size(); ++i) {
        let face = faces.get(i);

        // Check if the face is inside the circle
        let faceCenterX = face.x + face.width / 2;
        let faceCenterY = face.y + face.height / 2;
        if (Math.hypot(faceCenterX - circleX, faceCenterY - circleY) < circleRadius) {
            if (startTime === null) {
                // Start the timer
                startTime = Date.now();
            } else if (Date.now() - startTime > requiredTime) {
                // Face has been inside the circle for the required time
                console.log("Face detected inside the circle for 10 seconds");
                // Perform action here
            }
        } else {
            // Face is outside the circle, reset the timer
            startTime = null;
        }
    }
    requestAnimationFrame(processVideo);
};
