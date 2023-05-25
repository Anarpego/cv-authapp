let video;
let canvas;
let context;
let rectangle;

window.onload = function() {
    video = document.getElementById('video');
    canvas = document.getElementById('canvas');
    context = canvas.getContext('2d');

    rectangle = {x: 50, y: 50, width: 400, height: 300};

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(function (stream) {
                video.srcObject = stream;
            })
            .catch(function (err) {
                console.log('An error occurred: ' + err);
            });
    } else {
        console.log('getUserMedia not supported');
    }

    document.getElementById('capture').addEventListener('click', function() {
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
        .then(response => {
            console.log(response);
            if(response.ok) {
                return response.json();
            } else {
                throw new Error('Server response was not ok');
            }
        })
        .then(data => {
            if (data.status === 'success') {
                console.log('Image saved successfully.');
            } else {
                console.error('Failed to save image.');
            }
        })
        .catch(err => {
            console.error('Fetch Error:', err);
        });
    });

    requestAnimationFrame(draw);
};

function draw() {
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    context.beginPath();
    context.rect(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
    context.strokeStyle = 'red';
    context.lineWidth = 2;
    context.stroke();

    requestAnimationFrame(draw);
}

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
