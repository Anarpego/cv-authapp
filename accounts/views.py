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

def face_login(request):
    return render(request, 'face_login.html')
