import cv2
import os
import base64
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
        # remove the beginning of the base64 string
        data = data.split(',')[1]
        binary_data = base64.b64decode(data)
        with open(os.path.join('static', 'temp_pictures', 'snapshot.png'), 'wb') as f:
            f.write(binary_data)
        return JsonResponse({'status': 'success'})
    else:
        return JsonResponse({'status': 'failed'})