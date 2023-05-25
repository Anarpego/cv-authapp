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
            // If processing is complete, redirect to the next page
            window.location.href = "/next_page/";
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
