from django.urls import path
from . import views

urlpatterns = [
    path('', views.home),
    path("logout", views.logout_view),
    path('face_login/', views.face_login, name='face_login'),
    path('save_image/', views.save_image, name='save_image'),
    path('id_capture/', views.id_capture, name='id_capture'),
    path('save_id_image/', views.save_id_image, name='save_id_image'),
    path('processing/', views.processing, name='processing')
]
