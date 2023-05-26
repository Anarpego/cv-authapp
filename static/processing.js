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
            var confirmText = document.getElementById('confirmText');
            var yesButton = document.getElementById('yesButton');
            var noButton = document.getElementById('noButton');
            var phoneNumberInput = document.getElementById('phone_number');

            if (data.match) {
                confirmText.textContent = 
                "Your pictures match, please confirm your name to confirm and if not go back to take a better picture or upload your id document";
                phoneNumberInput.style.display = "block";
                yesButton.style.display = "block";  // Make the 'yes' button visible
                yesButton.onclick = function() {
                    // If the user clicked 'Yes', redirect to the welcome page
                    window.location.href = `/welcome/${data.nombre}/${data.apellido}/${phoneNumberInput.value}/`;
                }
                noButton.onclick = function() {
                    // If the user clicked 'No', redirect to the home page
                    window.location.href = "/";
                }
            } else {
                confirmText.textContent = 
                "The pictures don't match, please go back to repeat the process with better pictures";
                noButton.onclick = function() {
                    // If the user clicked 'No', redirect to the home page
                    window.location.href = "/";
                }
                // Hide the yes button and phone number input since the faces don't match
                yesButton.style.display = "none";
                phoneNumberInput.style.display = "none";
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
