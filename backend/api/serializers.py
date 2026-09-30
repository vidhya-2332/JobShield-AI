from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile, Job, Prediction, AnalysisHistory


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email")


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    full_name = serializers.CharField(write_only=True, required=False, default="")

    class Meta:
        model = User
        fields = ("id", "username", "email", "password", "full_name")

    def create(self, validated_data):
        full_name = validated_data.pop("full_name", "")
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
        )
        Profile.objects.filter(user=user).update(full_name=full_name)
        return user


class ProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.CharField(source="user.email", read_only=True)

    class Meta:
        model = Profile
        fields = ("id", "username", "email", "full_name", "avatar_url", "theme_preference", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")


class JobSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = "__all__"
        read_only_fields = ("id", "user", "created_at")


class JobInputSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=500)
    company_name = serializers.CharField(max_length=500, required=False, allow_blank=True, default="")
    company_profile = serializers.CharField(required=False, allow_blank=True, default="")
    website = serializers.CharField(required=False, allow_blank=True, default="")
    location = serializers.CharField(max_length=500, required=False, allow_blank=True, default="")
    salary = serializers.IntegerField(required=False, allow_null=True, default=0)
    salary_currency = serializers.CharField(max_length=10, required=False, allow_blank=True, default="USD")
    employment_type = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    experience = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    education = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    description = serializers.CharField()
    requirements = serializers.CharField(required=False, allow_blank=True, default="")
    benefits = serializers.CharField(required=False, allow_blank=True, default="")
    questions = serializers.CharField(required=False, allow_blank=True, default="")
    company_logo_url = serializers.CharField(required=False, allow_blank=True, default="")


class PredictionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prediction
        fields = "__all__"
        read_only_fields = ("id", "user", "created_at")


class AnalysisHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = AnalysisHistory
        fields = "__all__"
        read_only_fields = ("id", "user", "created_at")


class BatchJobInputSerializer(serializers.Serializer):
    jobs = JobInputSerializer(many=True)
