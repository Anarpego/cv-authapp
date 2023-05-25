let video;
let canvas;
let context;
let rectangle;
let imageUploaded = false;

document.addEventListener('DOMContentLoaded', function() {
    video = document.getElementById('video');
    canvas = document.getElementById('canvas');
    context = canvas.getContext('2d');
    rectangle = {x: 50, y: 50, width: 540, height: 380};  // Change these values as needed

    // Set up event listener for start capture button
    document.getElementById('startCapture').addEventListener('click', startCapture);

    // Set up event listener for capture button
    document.getElementById('capture').addEventListener('click', captureAndUpload);

    // Set up event listener for upload button
    document.getElementById('upload').addEventListener('change', handleFileUpload);

    // Set up event listener for create account button
    document.getElementById('create-account').addEventListener('click', function() {
        if (imageUploaded) {
            window.location.href = "/processing/";
        } else {
            alert('Please capture or upload an image before creating an account');
        }
    });
});

// Start capture function
function startCapture() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
        .then(function (stream) {
            video.srcObject = stream;
            video.style.display = 'block';
            requestAnimationFrame(draw);  // Start drawing when the camera is started
        })
        .catch(function (err) {
            console.log('An error occurred: ' + err);
        });
    } else {
        console.log('getUserMedia not supported');
    }
}

// Capture and upload function
function captureAndUpload() {
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    let imageData = context.getImageData(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
    let tempCanvas = document.createElement('canvas');
    tempCanvas.width = rectangle.width;
    tempCanvas.height = rectangle.height;
    let tempContext = tempCanvas.getContext('2d');
    tempContext.putImageData(imageData, 0, 0);
    let dataUrl = tempCanvas.toDataURL();
    fetch('/save_id_image/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: 'image=' + encodeURIComponent(dataUrl)
    })
    .then(handleFetchResponse)
    .then(handleFetchSuccess)
    .catch(handleFetchError);
}

// Draw function
function draw() {
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    context.beginPath();
    context.rect(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
    context.strokeStyle = 'red';
    context.lineWidth = 2;
    context.stroke();
    requestAnimationFrame(draw);
}

// Handle file upload function
function handleFileUpload(e) {
    let file = e.target.files[0];
    if (file) {
        let reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function() {
            fetch('/save_id_image/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: 'image=' + encodeURIComponent(reader.result)
            })
            .then(handleFetchResponse)
            .then(handleFetchSuccess)
            .catch(handleFetchError);
        };
    }
}

// Handle fetch response
function handleFetchResponse(response) {
    if (!response.ok) {
        throw Error("Server response was not ok");
    }
    return response.json();
}

// Handle fetch success
function handleFetchSuccess(data) {
    if (data.status === 'success') {
        console.log('Image saved successfully.');
        imageUploaded = true;
        document.getElementById('create-account').style.display = 'block';
    } else {
        console.error('Failed to save image.');
        imageUploaded = false;
    }
}

// Handle fetch error
function handleFetchError(error) {
    console.error('Fetch Error: ', error);
}

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
