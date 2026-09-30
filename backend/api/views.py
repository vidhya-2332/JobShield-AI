from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.db.models import Avg, Count
from datetime import timedelta
from django.utils import timezone

from .serializers import (
    RegisterSerializer, UserSerializer, ProfileSerializer,
    JobInputSerializer, PredictionSerializer,
    AnalysisHistorySerializer, BatchJobInputSerializer,
)
from .models import Profile, Job, Prediction, AnalysisHistory
from ml.types import JobInput
from ml.predict import predict
from ml.model_metrics import MODEL_PERFORMANCE, FEATURE_IMPORTANCE


def _rules_to_dicts(rules):
    return [
        {
            "rule_id": r.rule_id, "rule_name": r.rule_name, "triggered": r.triggered,
            "weight": r.weight, "category": r.category, "message": r.message,
        }
        for r in rules
    ]


def _contributions_to_dicts(contributions):
    return [
        {"feature": c.feature, "value": c.value, "contribution": c.contribution, "direction": c.direction}
        for c in contributions
    ]


def _result_response(prediction_obj, job_obj, result):
    return {
        "prediction_id": prediction_obj.id,
        "job_id": job_obj.id,
        "prediction": result.prediction,
        "risk_score": result.risk_score,
        "risk_level": result.risk_level,
        "fraud_probability": result.fraud_probability,
        "confidence_score": result.confidence_score,
        "rule_score": result.rule_score,
        "ml_score": result.ml_score,
        "model_used": result.model_used,
        "explanation": result.explanation,
        "positive_factors": result.positive_factors,
        "negative_factors": result.negative_factors,
        "recommendations": result.recommendations,
        "triggered_rules": _rules_to_dicts(result.triggered_rules),
        "feature_contributions": _contributions_to_dicts(result.feature_contributions),
        "extracted_features": result.extracted_features,
    }


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password(request):
    new_password = request.data.get("password", "")
    if len(new_password) < 6:
        return Response({"error": "Password must be at least 6 characters."}, status=status.HTTP_400_BAD_REQUEST)
    request.user.set_password(new_password)
    request.user.save()
    return Response({"message": "Password updated successfully."})


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response(
            {"user": UserSerializer(user).data, "message": "Account created successfully."},
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def profile(request):
    try:
        prof = request.user.profile
    except Profile.DoesNotExist:
        prof = Profile.objects.create(user=request.user)

    if request.method == "GET":
        return Response(ProfileSerializer(prof).data)

    serializer = ProfileSerializer(prof, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def analyze_job(request):
    serializer = JobInputSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data
    job_input = JobInput(**data)
    result = predict(job_input)

    job = Job.objects.create(user=request.user, **data)
    prediction_obj = Prediction.objects.create(
        job=job,
        user=request.user,
        prediction=result.prediction,
        risk_score=result.risk_score,
        risk_level=result.risk_level,
        fraud_probability=result.fraud_probability,
        confidence_score=result.confidence_score,
        rule_score=result.rule_score,
        ml_score=result.ml_score,
        model_used=result.model_used,
        explanation=result.explanation,
        positive_factors=result.positive_factors,
        negative_factors=result.negative_factors,
        recommendations=result.recommendations,
        triggered_rules=_rules_to_dicts(result.triggered_rules),
        feature_contributions=_contributions_to_dicts(result.feature_contributions),
        extracted_features=result.extracted_features,
    )

    AnalysisHistory.objects.create(
        user=request.user,
        prediction=prediction_obj,
        job_title=job.title,
        company_name=job.company_name,
        risk_score=result.risk_score,
        prediction_label=result.prediction,
        fraud_probability=result.fraud_probability,
    )

    return Response(_result_response(prediction_obj, job, result), status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def batch_analyze(request):
    serializer = BatchJobInputSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    jobs_data = serializer.validated_data["jobs"]
    results = []

    for job_data in jobs_data:
        job_input = JobInput(**job_data)
        result = predict(job_input)

        job = Job.objects.create(user=request.user, **job_data)
        prediction_obj = Prediction.objects.create(
            job=job,
            user=request.user,
            prediction=result.prediction,
            risk_score=result.risk_score,
            risk_level=result.risk_level,
            fraud_probability=result.fraud_probability,
            confidence_score=result.confidence_score,
            rule_score=result.rule_score,
            ml_score=result.ml_score,
            model_used=result.model_used,
            explanation=result.explanation,
            positive_factors=result.positive_factors,
            negative_factors=result.negative_factors,
            recommendations=result.recommendations,
            triggered_rules=_rules_to_dicts(result.triggered_rules),
            feature_contributions=_contributions_to_dicts(result.feature_contributions),
            extracted_features=result.extracted_features,
        )
        AnalysisHistory.objects.create(
            user=request.user,
            prediction=prediction_obj,
            job_title=job.title,
            company_name=job.company_name,
            risk_score=result.risk_score,
            prediction_label=result.prediction,
            fraud_probability=result.fraud_probability,
        )

        results.append({
            "job_title": job.title,
            "company_name": job.company_name,
            "risk_score": result.risk_score,
            "risk_level": result.risk_level,
            "prediction": result.prediction,
            "fraud_probability": result.fraud_probability,
            "explanation": result.explanation,
        })

    return Response({"results": results, "count": len(results)}, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_predictions(request):
    predictions = Prediction.objects.filter(user=request.user).order_by("-created_at").select_related("job")
    serializer = PredictionSerializer(predictions, many=True)
    data = serializer.data
    for item, pred_obj in zip(data, predictions):
        item["job"] = {
            "id": pred_obj.job.id,
            "title": pred_obj.job.title,
            "company_name": pred_obj.job.company_name,
            "company_profile": pred_obj.job.company_profile,
            "website": pred_obj.job.website,
            "location": pred_obj.job.location,
            "salary": pred_obj.job.salary,
            "salary_currency": pred_obj.job.salary_currency,
            "employment_type": pred_obj.job.employment_type,
            "experience": pred_obj.job.experience,
            "education": pred_obj.job.education,
            "description": pred_obj.job.description,
            "requirements": pred_obj.job.requirements,
            "benefits": pred_obj.job.benefits,
            "questions": pred_obj.job.questions,
            "company_logo_url": pred_obj.job.company_logo_url,
            "created_at": pred_obj.job.created_at.isoformat(),
        }
    return Response(data)


@api_view(["GET", "DELETE"])
@permission_classes([IsAuthenticated])
def get_prediction(request, pk):
    try:
        prediction_obj = Prediction.objects.get(pk=pk, user=request.user)
    except Prediction.DoesNotExist:
        return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "DELETE":
        prediction_obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    data = PredictionSerializer(prediction_obj).data
    job = prediction_obj.job
    data["job"] = {
        "id": job.id, "title": job.title, "company_name": job.company_name,
        "company_profile": job.company_profile, "website": job.website, "location": job.location,
        "salary": job.salary, "salary_currency": job.salary_currency, "employment_type": job.employment_type,
        "experience": job.experience, "education": job.education, "description": job.description,
        "requirements": job.requirements, "benefits": job.benefits, "questions": job.questions,
        "company_logo_url": job.company_logo_url, "created_at": job.created_at.isoformat(),
    }
    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_history(request):
    history = AnalysisHistory.objects.filter(user=request.user).order_by("-created_at")
    serializer = AnalysisHistorySerializer(history, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    user = request.user
    predictions = Prediction.objects.filter(user=user)
    total = predictions.count()

    if total == 0:
        return Response({
            "total_predictions": 0,
            "avg_risk_score": 0,
            "fraud_detected": 0,
            "legitimate": 0,
            "risk_distribution": {"low": 0, "medium": 0, "high": 0, "critical": 0},
            "recent_predictions": [],
        })

    avg_score = predictions.aggregate(Avg("risk_score"))["risk_score__avg"]
    fraud_detected = predictions.filter(prediction="fraudulent").count()
    legitimate = total - fraud_detected

    risk_dist = predictions.values("risk_level").annotate(count=Count("id"))
    distribution = {"low": 0, "medium": 0, "high": 0, "critical": 0}
    for item in risk_dist:
        distribution[item["risk_level"]] = item["count"]

    recent = predictions.select_related("job")[:5]
    recent_data = [
        {
            "id": p.id,
            "job_title": p.job.title,
            "company_name": p.job.company_name,
            "risk_score": p.risk_score,
            "risk_level": p.risk_level,
            "prediction": p.prediction,
            "created_at": p.created_at.isoformat(),
        }
        for p in recent
    ]

    return Response({
        "total_predictions": total,
        "avg_risk_score": round(avg_score, 2),
        "fraud_detected": fraud_detected,
        "legitimate": legitimate,
        "risk_distribution": distribution,
        "recent_predictions": recent_data,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def analytics(request):
    user = request.user
    predictions = Prediction.objects.filter(user=user)

    thirty_days_ago = timezone.now() - timedelta(days=30)
    recent = predictions.filter(created_at__gte=thirty_days_ago)

    monthly = recent.extra({"month": "date_trunc('month', created_at)"}).values("month").annotate(
        count=Count("id"), avg_score=Avg("risk_score")
    ).order_by("month")

    risk_dist = predictions.values("risk_level").annotate(count=Count("id"))
    distribution = {"low": 0, "medium": 0, "high": 0, "critical": 0}
    for item in risk_dist:
        distribution[item["risk_level"]] = item["count"]

    return Response({
        "monthly_trends": list(monthly),
        "risk_distribution": distribution,
        "total_analyzed": predictions.count(),
        "avg_risk_score": predictions.aggregate(Avg("risk_score"))["risk_score__avg"] or 0,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def model_performance(request):
    return Response({
        "models": MODEL_PERFORMANCE,
        "feature_importance": FEATURE_IMPORTANCE,
    })
