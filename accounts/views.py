import cv2
import numpy as np
from PIL import Image
import os
import base64
from google.cloud import vision
from celery import shared_task
from django.shortcuts import render, redirect
from django.contrib.auth import logout
from django.http import StreamingHttpResponse, JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt

def home(request): 
    return render(request, "home.html")

def logout_view(request):
    logout(request)
    return redirect("/")

def face_login(request):
    return render(request, 'face_login.html')

@csrf_exempt
def save_image(request):
    if request.method == 'POST':
        data = request.POST['image']
        print('Data:', data)  # Add this line
        # remove the beginning of the base64 string
        data = data.split(',')[1]
        binary_data = base64.b64decode(data)
        save_path = os.path.join('static', 'temp_pictures', 'snapshot.png')
        with open(save_path, 'wb') as f:
            f.write(binary_data)
        return JsonResponse({'status': 'success'})
    else:
        return JsonResponse({'status': 'failed'})


def id_capture(request):
    return render(request, 'id_capture.html')

@csrf_exempt
def save_id_image(request):
    if request.method == 'POST':
        try:
            image_data = request.POST.get('image')
            image_data = base64.b64decode(image_data.split(',')[1])
            with open(os.path.join('static', 'temp_pictures', 'id_image.png'), 'wb') as f:
                f.write(image_data)
            return JsonResponse({'status': 'success'})
        except Exception as e:
            return JsonResponse({'status': 'fail', 'error': str(e)})
    else:
        return JsonResponse({'status': 'fail'})

@shared_task
def process_data():
    extract_face()
    extract_largest_id_face()
    extract_text()
    
def processing(request):
    process_data.delay()
    return render(request, 'processing.html')

def extract_face():
    # Load the image
    img = cv2.imread('static/temp_pictures/snapshot.png')

    # Define the circle
    circle_center = (img.shape[1]//2, img.shape[0]//2)  # (x, y) position
    circle_radius = 150  # radius

    # Create a mask for the circular area
    mask = np.zeros((img.shape[0], img.shape[1]), np.uint8)
    cv2.circle(mask, circle_center, circle_radius, (255, 255, 255), -1)

    # Apply the mask to the image
    masked_img = cv2.bitwise_and(img, img, mask=mask)

    # Convert the OpenCV image (in BGR format) to a PIL image (in RGB format)
    pil_img = Image.fromarray(cv2.cvtColor(masked_img, cv2.COLOR_BGR2RGB))

    # Crop to the circular area
    bbox = (circle_center[0] - circle_radius, circle_center[1] - circle_radius, 
            circle_center[0] + circle_radius, circle_center[1] + circle_radius)
    cropped_pil_img = pil_img.crop(bbox)

    # Save the cropped image
    cropped_pil_img.save('static/temp_pictures/face.png')
    

def extract_largest_id_face():
    # Load the image
    img = cv2.imread('static/temp_pictures/id_image.png')

    # Load the Haar cascade xml file for face detection
    face_cascade = cv2.CascadeClassifier('static/haarcascades/haarcascade_frontalface_default.xml')

    # Convert the image to gray scale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Perform face detection
    faces = face_cascade.detectMultiScale(gray, 1.1, 4)

    # Check if any face is detected
    if len(faces) == 0:
        print("No face detected.")
        return

    # Find the largest face
    largest_face = max(faces, key=lambda rectangle: rectangle[2] * rectangle[3])

    # Extract the largest face
    x, y, w, h = largest_face
    face_img = img[y:y+h, x:x+w]

    # Save the face image
    cv2.imwrite('static/temp_pictures/largest_face.png', face_img)

def extract_text():
    # Load the image
    img = cv2.imread('static/temp_pictures/id_image.png')

    # Convert the image to gray scale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Threshold the image to get black and white effect
    ret, thresh1 = cv2.threshold(gray, 0, 255, cv2.THRESH_OTSU | cv2.THRESH_BINARY_INV)

    # Specify structure shape and kernel size. Kernel size increases or decreases the area
    # of the rectangle to be detected. A smaller value like (10, 10) will detect each word,
    # while a larger value like (30, 30) will detect whole lines of text.
    rect_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (30, 30))

    # Apply dilation on the threshold image
    dilation = cv2.dilate(thresh1, rect_kernel, iterations = 1)

    # Find contours
    contours, hierarchy = cv2.findContours(dilation, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)

    # Create a copy of image for bounding box
    im2 = img.copy()

    # Create a Vision client
    client = vision.ImageAnnotatorClient()

    # Loop through all contours and extract bounding boxes
    for cnt in contours:
        x, y, w, h = cv2.boundingRect(cnt)

        # Draw rectangle to visualize the bounding box
        rect = cv2.rectangle(im2, (x, y), (x + w, y + h), (0, 255, 0), 2)

        # Cropping the text block for giving input to OCR
        cropped = im2[y:y + h, x:x + w]

        # Convert the cropped image to bytes
        cropped_bytes = cv2.imencode('.png', cropped)[1].tostring()

        # Create an Image object
        image = vision.Image(content=cropped_bytes)

        # Apply OCR using the Vision API
        response = client.text_detection(image=image)

        # Check for errors
        if response.error.message:
            raise Exception(
                '{}\nFor more info on error messages, check: '
                'https://cloud.google.com/apis/design/errors'.format(
                    response.error.message))
            
        # Extract text annotations from the response
        texts = response.text_annotations

        # Print the detected texts and their bounding polygons
        for text in texts:
            print(f'\n"{text.description}"')
            vertices = ([f'({vertex.x},{vertex.y})' for vertex in text.bounding_poly.vertices])
            print('bounds: {}'.format(','.join(vertices)))
