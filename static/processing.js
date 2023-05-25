// Check the processing status every 5 seconds
setInterval(checkProcessingStatus, 5000);

function checkProcessingStatus() {
    fetch('/get_processing_status/', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')  // Django's CSRF token
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'complete') {
            // If processing is complete, show a confirmation prompt
            document.getElementById('confirmText').textContent = 
            `Faces match: ${data.match}\nIs this information correct?\nNombre: ${data.nombre}\nApellido: ${data.apellido}`;
            var modal = document.getElementById('confirmModal');
            modal.style.display = "block";

            document.getElementById('noButton').onclick = function() {
                // If the user clicked 'No', redirect to the home page
                modal.style.display = "none";
                window.location.href = "/";
            }
            document.getElementById('yesButton').onclick = function() {
                // If the user clicked 'Yes', redirect to the welcome page
                modal.style.display = "none";
                window.location.href = `/welcome/${data.nombre}/${data.apellido}/`;
            }
        }
    })
    .catch(error => console.error('Error:', error));
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
