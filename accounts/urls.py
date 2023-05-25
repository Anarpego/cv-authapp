from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('logout', views.logout_view, name='logout'),
    path('face_login/', views.face_login, name='face_login'),
    path('save_image/', views.save_image, name='save_image'),
    path('id_capture/', views.id_capture, name='id_capture'),
    path('save_id_image/', views.save_id_image, name='save_id_image'),
    path('processing/', views.processing, name='processing'),
    path('get_processing_status/', views.get_processing_status, name='get_processing_status'),
    path('welcome/<str:nombre>/<str:apellido>/', views.welcome, name='welcome')
]
