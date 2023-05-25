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
let timer = null;
const circleRadius = 150;  // Adjust this to fit your needs
const requiredTime = 50000;  // 10 seconds

// Run this after the DOM has loaded
document.addEventListener('DOMContentLoaded', (event) => {
    video = document.getElementById("video");
    canvas = document.getElementById("canvas");
    context = canvas.getContext("2d");
    timer = document.getElementById("timer");

    // Add click event listener to next button
    document.getElementById('next').addEventListener('click', function() {
        window.location.href = '/id_capture/';
    });
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
                // Convert canvas to data URL
                let dataUrl = canvas.toDataURL();

                // Send the image data to the server
                fetch('/save_image/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'X-CSRFToken': getCookie('csrftoken')  // Django's CSRF token
                    },
                    body: 'image=' + encodeURIComponent(dataUrl)
                })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        console.log('Image saved successfully.');
                        document.getElementById('next').style.display = 'block';  // Unhide the "Next" button
                    } else {
                        console.error('Failed to save image.');
                    }
                });

                // Reset timer
                startTime = null;
                timer.innerHTML = "0:00";
            } else {
                // Update timer
                let elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
                let minutes = Math.floor(elapsedSeconds / 60);
                let seconds = elapsedSeconds % 60;
                timer.innerHTML = minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
            }
        } else {
            // Face is outside the circle, reset the timer
            startTime = null;
            timer.innerHTML = "0:00";
        }
    }

    requestAnimationFrame(processVideo);
};

// Utility function to get a cookie by name
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        let cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
