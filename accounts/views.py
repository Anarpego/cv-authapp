import cv2
import os
from django.shortcuts import render, redirect
from django.contrib.auth import logout
from django.http import StreamingHttpResponse
from django.http import HttpResponse

def home(request): 
    return render(request, "home.html")

def logout_view(request):
    logout(request)
    return redirect("/")

def gen(camera):
    # Determine the path to the Haar cascade file
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    cascade_file = os.path.join(base_dir, 'haarcascades', 'haarcascade_frontalface_alt.xml')

    face_cascade = cv2.CascadeClassifier(cascade_file)
    
    webcam = cv2.VideoCapture(0)
    
    while(1):
 
        #Capturar una imagen con la webcam:
        valido, img = webcam.read()
 
        #Si la imagen es válida (es decir, si se ha capturado correctamente), continuamos:
        if valido:
            #Convertir la imagen a gris:
            img_gris = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            #Buscamos los rostros:
            coordenadas_rostros = face_cascade.detectMultiScale(img_gris, 1.3, 5)
            #Recorremos el array 'coordenadas_rostros' y dibujamos los rectángulos sobre la imagen original:
            for (x,y,ancho, alto) in coordenadas_rostros:
                cv2.rectangle(img, (x,y), (x+ancho, y+alto), (0,0,255) , 3)
             
            #Abrimos una ventana con el resultado:
           #cv2.imshow('salida', img)
 
            #Salir con 'ESC':
            #k = cv2.waitKey(5) & 0xFF
            #if k == 27:
             #   cv2.destroyAllWindows()
              #  break
 
    webcam.release()

    # while True:
    #     data = camera.read()
    #     frame = data[1]
    #     gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    #     faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))

    #     for (x, y, w, h) in faces:
    #         cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)

    #     ret, jpeg = cv2.imencode('.jpg', frame)
    #     frame = jpeg.tobytes()
    #     yield (b'--frame\r\n'
    #            b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n\r\n')

def face_login(request):
    return render(request, 'face_login.html')
