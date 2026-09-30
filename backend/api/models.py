from django.db import models
from django.contrib.auth.models import User


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    full_name = models.CharField(max_length=255, blank=True, default="")
    avatar_url = models.URLField(blank=True, default="")
    theme_preference = models.CharField(max_length=20, default="dark")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} profile"


class Job(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="jobs")
    title = models.CharField(max_length=500)
    company_name = models.CharField(max_length=500, blank=True, default="")
    company_profile = models.TextField(blank=True, default="")
    website = models.CharField(max_length=500, blank=True, default="")
    location = models.CharField(max_length=500, blank=True, default="")
    salary = models.IntegerField(null=True, blank=True, default=0)
    salary_currency = models.CharField(max_length=10, blank=True, default="USD")
    employment_type = models.CharField(max_length=100, blank=True, default="")
    experience = models.CharField(max_length=100, blank=True, default="")
    education = models.CharField(max_length=100, blank=True, default="")
    description = models.TextField(blank=True, default="")
    requirements = models.TextField(blank=True, default="")
    benefits = models.TextField(blank=True, default="")
    questions = models.TextField(blank=True, default="")
    company_logo_url = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} at {self.company_name}"


class Prediction(models.Model):
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name="predictions")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="predictions")
    prediction = models.CharField(max_length=20, default="genuine")
    risk_level = models.CharField(max_length=20, default="low")
    fraud_probability = models.FloatField(default=0)
    risk_score = models.FloatField(default=0)
    confidence_score = models.FloatField(default=0)
    rule_score = models.FloatField(default=0)
    ml_score = models.FloatField(default=0)
    model_used = models.CharField(max_length=200, blank=True, default="")
    explanation = models.TextField(blank=True, default="")
    triggered_rules = models.JSONField(default=list)
    feature_contributions = models.JSONField(default=list)
    positive_factors = models.JSONField(default=list)
    negative_factors = models.JSONField(default=list)
    recommendations = models.JSONField(default=list)
    extracted_features = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Prediction for {self.job.title}: {self.prediction} ({self.risk_score})"


class AnalysisHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="history")
    prediction = models.ForeignKey(Prediction, on_delete=models.CASCADE, related_name="history_entries", null=True)
    job_title = models.CharField(max_length=500)
    company_name = models.CharField(max_length=500, blank=True, default="")
    prediction_label = models.CharField(max_length=20, default="genuine")
    risk_score = models.FloatField(default=0)
    fraud_probability = models.FloatField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "Analysis histories"

    def __str__(self):
        return f"{self.job_title}: {self.prediction_label}"
