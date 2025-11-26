# models.py
from django.db import models
from django.utils import timezone

class Todo(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    due_date = models.DateField(null=True, blank=True)
    resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    def is_overdue(self):
        if self.due_date and not self.resolved:
            return self.due_date < timezone.now().date()
        return False


# forms.py
from django import forms
from .models import Todo

class TodoForm(forms.ModelForm):
    class Meta:
        model = Todo
        fields = ['title', 'description', 'due_date', 'resolved']
        widgets = {
            'title': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Enter todo title'}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'rows': 3, 'placeholder': 'Description (optional)'}),
            'due_date': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
            'resolved': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        }


# views.py
from django.shortcuts import render, redirect, get_object_or_404
from django.views.generic import ListView, CreateView, UpdateView, DeleteView
from django.urls import reverse_lazy
from .models import Todo
from .forms import TodoForm

class TodoListView(ListView):
    model = Todo
    template_name = 'todos/todo_list.html'
    context_object_name = 'todos'

    def get_queryset(self):
        queryset = super().get_queryset()
        status = self.request.GET.get('status')
        if status == 'active':
            queryset = queryset.filter(resolved=False)
        elif status == 'resolved':
            queryset = queryset.filter(resolved=True)
        return queryset


class TodoCreateView(CreateView):
    model = Todo
    form_class = TodoForm
    template_name = 'todos/todo_form.html'
    success_url = reverse_lazy('todo_list')


class TodoUpdateView(UpdateView):
    model = Todo
    form_class = TodoForm
    template_name = 'todos/todo_form.html'
    success_url = reverse_lazy('todo_list')


class TodoDeleteView(DeleteView):
    model = Todo
    template_name = 'todos/todo_confirm_delete.html'
    success_url = reverse_lazy('todo_list')


def toggle_resolved(request, pk):
    todo = get_object_or_404(Todo, pk=pk)
    todo.resolved = not todo.resolved
    todo.save()
    return redirect('todo_list')


# urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('', views.TodoListView.as_view(), name='todo_list'),
    path('create/', views.TodoCreateView.as_view(), name='todo_create'),
    path('<int:pk>/edit/', views.TodoUpdateView.as_view(), name='todo_edit'),
    path('<int:pk>/delete/', views.TodoDeleteView.as_view(), name='todo_delete'),
    path('<int:pk>/toggle/', views.toggle_resolved, name='todo_toggle'),
]


# admin.py
from django.contrib import admin
from .models import Todo

@admin.register(Todo)
class TodoAdmin(admin.ModelAdmin):
    list_display = ['title', 'due_date', 'resolved', 'created_at']
    list_filter = ['resolved', 'due_date']
    search_fields = ['title', 'description']


# templates/todos/base.html
"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TODO App</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        .overdue { color: #dc3545; }
        .resolved { text-decoration: line-through; opacity: 0.6; }
    </style>
</head>
<body>
    <nav class="navbar navbar-dark bg-primary mb-4">
        <div class="container">
            <a class="navbar-brand" href="{% url 'todo_list' %}">TODO App</a>
        </div>
    </nav>
    <div class="container">
        {% block content %}{% endblock %}
    </div>
</body>
</html>
"""


# templates/todos/todo_list.html
"""
{% extends 'todos/base.html' %}

{% block content %}
<div class="d-flex justify-content-between align-items-center mb-4">
    <h2>My TODOs</h2>
    <a href="{% url 'todo_create' %}" class="btn btn-primary">Add New TODO</a>
</div>

<div class="btn-group mb-3" role="group">
    <a href="{% url 'todo_list' %}" class="btn btn-outline-secondary">All</a>
    <a href="{% url 'todo_list' %}?status=active" class="btn btn-outline-secondary">Active</a>
    <a href="{% url 'todo_list' %}?status=resolved" class="btn btn-outline-secondary">Resolved</a>
</div>

{% if todos %}
    <div class="list-group">
        {% for todo in todos %}
        <div class="list-group-item {% if todo.resolved %}resolved{% endif %}">
            <div class="d-flex w-100 justify-content-between align-items-start">
                <div class="flex-grow-1">
                    <h5 class="mb-1">{{ todo.title }}</h5>
                    {% if todo.description %}
                        <p class="mb-1">{{ todo.description }}</p>
                    {% endif %}
                    {% if todo.due_date %}
                        <small class="{% if todo.is_overdue %}overdue{% endif %}">
                            Due: {{ todo.due_date }}
                            {% if todo.is_overdue %} (Overdue!){% endif %}
                        </small>
                    {% endif %}
                </div>
                <div class="btn-group" role="group">
                    <a href="{% url 'todo_toggle' todo.pk %}" class="btn btn-sm btn-outline-success">
                        {% if todo.resolved %}Unmark{% else %}Mark Done{% endif %}
                    </a>
                    <a href="{% url 'todo_edit' todo.pk %}" class="btn btn-sm btn-outline-primary">Edit</a>
                    <a href="{% url 'todo_delete' todo.pk %}" class="btn btn-sm btn-outline-danger">Delete</a>
                </div>
            </div>
        </div>
        {% endfor %}
    </div>
{% else %}
    <p class="text-muted">No TODOs yet. Create your first one!</p>
{% endif %}
{% endblock %}
"""


# templates/todos/todo_form.html
"""
{% extends 'todos/base.html' %}

{% block content %}
<h2>{% if form.instance.pk %}Edit{% else %}Create{% endif %} TODO</h2>
<form method="post">
    {% csrf_token %}
    <div class="mb-3">
        <label class="form-label">Title</label>
        {{ form.title }}
        {% if form.title.errors %}
            <div class="text-danger">{{ form.title.errors }}</div>
        {% endif %}
    </div>
    <div class="mb-3">
        <label class="form-label">Description</label>
        {{ form.description }}
    </div>
    <div class="mb-3">
        <label class="form-label">Due Date</label>
        {{ form.due_date }}
    </div>
    <div class="mb-3 form-check">
        {{ form.resolved }}
        <label class="form-check-label">Mark as resolved</label>
    </div>
    <button type="submit" class="btn btn-primary">Save</button>
    <a href="{% url 'todo_list' %}" class="btn btn-secondary">Cancel</a>
</form>
{% endblock %}
"""


# templates/todos/todo_confirm_delete.html
"""
{% extends 'todos/base.html' %}

{% block content %}
<h2>Delete TODO</h2>
<p>Are you sure you want to delete "{{ todo.title }}"?</p>
<form method="post">
    {% csrf_token %}
    <button type="submit" class="btn btn-danger">Delete</button>
    <a href="{% url 'todo_list' %}" class="btn btn-secondary">Cancel</a>
</form>
{% endblock %}
"""