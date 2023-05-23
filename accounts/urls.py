from django.urls import path
from . import views

urlpatterns = [
    path('', views.home),
    path("logout", views.logout_view),
    path('face_login/', views.face_login, name='face_login'),
]
