import cv2
import numpy as np
from PIL import Image
import os
import base64
from google.cloud import vision
from django.shortcuts import render, redirect
from django.contrib.auth import logout
from django.http import StreamingHttpResponse, JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt

import face_recognition

processing_results = {'status': 'processing', 'match': False, 'nombre': '', 'apellido': ''}

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
    

import numpy as np

def extract_largest_id_face():
    img = cv2.imread('static/temp_pictures/id_image.png')
    face_cascade = cv2.CascadeClassifier('static/haarcascades/haarcascade_frontalface_default.xml')
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.1, 4)
    
    # Check if any face was detected
    if len(faces) == 0:
        print("No face detected. Saving a black square image.")
        black_square = np.zeros((100, 100, 3), np.uint8)  # Create a black square with a size of 100x100
        cv2.imwrite('static/temp_pictures/largest_face.png', black_square)
        return

    # Calculate the face that has the largest area
    largest_face = max(faces, key=lambda rectangle: rectangle[2] * rectangle[3])

    x, y, w, h = largest_face
    x -= w // 10
    y -= h // 10
    w += w // 5
    h += h // 5

    x = max(x, 0)
    y = max(y, 0)
    w = min(w, img.shape[1] - x)
    h = min(h, img.shape[0] - y)

    cropped_img = img[y:y+h, x:x+w]

    cv2.imwrite('static/temp_pictures/largest_face.png', cropped_img)


import face_recognition

def compare_faces():
    # Load the images
    imagen_camara = face_recognition.load_image_file("static/temp_pictures/face.png")
    imagen_id = face_recognition.load_image_file("static/temp_pictures/largest_face.png")

    # Extract the face encodings from both images
    face_camara_encodings = face_recognition.face_encodings(imagen_camara, model="cnn")
    face_id_encodings = face_recognition.face_encodings(imagen_id, model="cnn")

    # Check if a face is found in both images
    if len(face_camara_encodings) == 0 or len(face_id_encodings) == 0:
        print("No face found in one or both images.")
        return False

    # Compare the face encodings
    match = face_recognition.compare_faces(face_id_encodings, face_camara_encodings[0], tolerance=0.6)

    if match[0]:
        print("The faces match.")
    else:
        print("The faces do not match.")

    # Return the result
    return match[0]


def extract_text():
    # Load the image
    img = cv2.imread('static/temp_pictures/id_image.png')

    # Convert the image to gray scale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Threshold the image to get black and white effect
    ret, thresh1 = cv2.threshold(gray, 0, 255, cv2.THRESH_OTSU | cv2.THRESH_BINARY_INV)

    # Specify structure shape and kernel size
    rect_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (30, 30))

    # Apply dilation on the threshold image
    dilation = cv2.dilate(thresh1, rect_kernel, iterations = 1)

    # Find contours
    contours, hierarchy = cv2.findContours(dilation, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)

    # Create a copy of image for bounding box
    im2 = img.copy()

    # Create a Vision client
    client = vision.ImageAnnotatorClient()

    # Initialize variables for storing name and surname
    nombre = ''
    apellido = ''

    # Loop through all contours and extract bounding boxes
    for cnt in contours:
        x, y, w, h = cv2.boundingRect(cnt)

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

        # Iterate over the detected text
        for i, text in enumerate(texts):
            # If the text is 'NOMBRE:' and there is a next element
            if text.description == 'NOMBRE' and i+1 < len(texts):
                nombre = texts[i+1].description  # Save the next element as name

            # If the text is 'APELLIDO:' and there is a next element
            if text.description == 'APELLIDO' and i+1 < len(texts):
                apellido = texts[i+1].description  # Save the next element as surname

    # Print the detected name and surname
    print(f'Nombre: {nombre}\nApellido: {apellido}')
    
    return nombre, apellido
  
def processing(request):
    global processing_results
    extract_face()
    extract_largest_id_face()
    match = compare_faces()
    nombre, apellido = extract_text()
    processing_results = {
        'status': 'complete', 
        'match': bool(match),
        'nombre': nombre, 
        'apellido': apellido
    }
    return render(request, 'processing.html', processing_results)


@csrf_exempt
def get_processing_status(request):
    return JsonResponse(processing_results)


def welcome(request, nombre, apellido):
    print("Nombre: ", nombre)
    print("Apellido: ", apellido)
    return render(request, 'welcome.html', {'nombre': nombre, 'apellido': apellido})




