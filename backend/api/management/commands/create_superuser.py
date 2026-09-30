from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import Profile


class Command(BaseCommand):
    help = "Create a superuser with a linked profile for testing"

    def add_arguments(self, parser):
        parser.add_argument("--username", default="admin")
        parser.add_argument("--email", default="admin@jobshield.ai")
        parser.add_argument("--password", default="admin12345")

    def handle(self, *args, **options):
        username = options["username"]
        email = options["email"]
        password = options["password"]

        if User.objects.filter(username=username).exists():
            self.stdout.write(self.style.WARNING(f"User '{username}' already exists."))
            return

        user = User.objects.create_superuser(username=username, email=email, password=password)
        Profile.objects.update_or_create(user=user, defaults={"full_name": "Admin", "theme": "dark"})
        self.stdout.write(self.style.SUCCESS(f"Superuser '{username}' created with password '{password}'."))
