from datetime import timedelta
from io import BytesIO

from django.conf import settings
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from PIL import Image, ImageDraw

from apps.accounts.models import User
from apps.accounts.services import register_user
from apps.bookings.models import Booking
from apps.bookings.services import create_booking, create_service_request, transition
from apps.catalog.models import Area, ServiceCategory, Skill
from apps.reports.services import create_report
from apps.reviews.services import create_review
from apps.trust.services import recalculate
from apps.verification.services import approve, submit
from apps.workers.services import set_service_areas, set_skills

S = Booking.Status
ADMIN = ("01900000001", "Demo Admin", "DemoAdmin#2026")
CUSTOMERS = [
    ("01700000001", "Nusrat Jahan", "Customer#2026"),
    ("01700000002", "Tanvir Ahmed", "Customer#2026"),
    ("01700000003", "Sabrina Haque", "Customer#2026"),
]
WORKERS = [
    ("01800000001", "রহিম উদ্দিন", ["ac-servicing", "ac-gas-refill"], ["mirpur", "shyamoli"], 9),
    ("01800000002", "Karim Hossain", ["tap-pipe-repair", "water-pump-repair"], ["dhanmondi"], 12),
    ("01800000003", "সালাম মিয়া", ["house-wiring", "fan-installation"], ["uttara"], 6),
    ("01800000004", "Jamal Uddin", ["interior-painting", "waterproofing"], ["badda"], 15),
    (
        "01800000005",
        "নাসির আহমেদ",
        ["refrigerator-repair", "washing-machine-repair"],
        ["mirpur"],
        4,
    ),
    ("01800000006", "Rubina Akter", ["home-deep-cleaning", "kitchen-cleaning"], ["gulshan"], 3),
]
WORKER_PIN = "482915"
JOBS = [
    (0, 0, "AC is not cooling.", "COMPLETED", (5, 5, 4, 5)),
    (0, 1, "Gas refill for split AC.", "COMPLETED", (4, 5, 5, 4)),
    (1, 0, "Kitchen tap is leaking.", "COMPLETED", (5, 4, 5, 5)),
    (3, 2, "Paint two bedrooms.", "COMPLETED", (4, 4, 3, 4)),
    (2, 1, "Install two ceiling fans.", "IN_PROGRESS", None),
    (0, 2, "AC makes noise.", "PENDING", None),
    (4, 0, "Fridge stopped cooling.", "DISPUTED", None),
]
FLOW = [S.ACCEPTED, S.ON_THE_WAY, S.IN_PROGRESS, S.AWAITING_CONFIRMATION]


def demo_image(label):
    image = Image.new("RGB", (640, 400), (30, 58, 138))
    ImageDraw.Draw(image).text((40, 40), f"SAMPLE {label}", fill=(255, 255, 255))
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return SimpleUploadedFile("sample.png", buffer.getvalue(), content_type="image/png")


class Command(BaseCommand):
    help = "Create demo accounts, workers, bookings, reviews, verifications and a dispute."

    def add_arguments(self, parser):
        parser.add_argument("--yes", action="store_true", help="Allow running with DEBUG off.")

    def handle(self, *args, **options):
        if not settings.DEBUG and not options["yes"]:
            raise CommandError("DEBUG is off. Re-run with --yes to seed this database.")
        if User.objects.filter(phone="+88" + ADMIN[0]).exists():
            self.stdout.write(self.style.WARNING("Demo data already exists. Nothing to do."))
            return
        with transaction.atomic():
            admin, customers, workers = self._people()
            self._jobs(admin, customers, workers)
            self._verification(admin, workers)
            for worker in workers:
                recalculate(worker, trigger="demo_seed")
        self._summary()

    def _people(self):
        phone, name, password = ADMIN
        admin = User.objects.create_user(
            phone=phone, password=password, full_name=name, role=User.Role.ADMIN, is_staff=True
        )
        customers = [
            register_user(role=User.Role.CUSTOMER, full_name=n, phone=p, password=pw)
            for p, n, pw in CUSTOMERS
        ]
        workers = []
        for phone, name, skills, areas, years in WORKERS:
            user = register_user(
                role=User.Role.WORKER, full_name=name, phone=phone, password=WORKER_PIN
            )
            profile = user.worker_profile
            set_skills(profile, Skill.objects.filter(slug__in=skills).values_list("id", flat=True))
            set_service_areas(
                profile, Area.objects.filter(slug__in=areas).values_list("id", flat=True)
            )
            profile.years_experience = years
            profile.bio = f"{years} years of experience. Careful, clean and on time."
            profile.availability_status = "AVAILABLE"
            profile.save()
            workers.append(profile)
        return admin, customers, workers

    def _jobs(self, admin, customers, workers):
        for index, (worker_index, customer_index, text, target, ratings) in enumerate(JOBS):
            worker = workers[worker_index]
            customer = customers[customer_index]
            skill = worker.skills.first()
            request = create_service_request(
                customer,
                skills=[skill],
                category=ServiceCategory.objects.get(pk=skill.category_id),
                area=worker.service_areas.first(),
                description=text,
                address_detail=f"House {index + 3}, Road {index + 1}",
                preferred_date=timezone.localdate() + timedelta(days=1),
                preferred_slot="MORNING",
            )
            booking = create_booking(request, worker)
            steps = {S.PENDING: [], S.IN_PROGRESS: FLOW[:3]}.get(target, FLOW)
            for status in steps:
                transition(booking.pk, status, actor=worker.user)
            if target == S.COMPLETED:
                transition(booking.pk, S.COMPLETED, actor=customer)
                booking.refresh_from_db()
                quality, professionalism, punctuality, communication = ratings
                create_review(
                    booking,
                    customer,
                    quality=quality,
                    professionalism=professionalism,
                    punctuality=punctuality,
                    communication=communication,
                    would_hire_again=quality >= 4,
                    comment="Good work, would call again.",
                )
            if target == S.DISPUTED:
                note = "The fridge stopped again after one hour."
                transition(booking.pk, S.DISPUTED, actor=customer, note=note)
                create_report(customer, "BOOKING", booking.pk, "POOR_WORK", note, is_dispute=True)

    def _verification(self, admin, workers):
        approved = submit(workers[0], "IDENTITY", [demo_image("NID FRONT"), demo_image("NID BACK")])
        approve(approved, admin)
        submit(workers[2], "IDENTITY", [demo_image("NID FRONT")])

    def _summary(self):
        self.stdout.write(self.style.SUCCESS("Demo data created. Sign in with:"))
        self.stdout.write(f"  Admin    {ADMIN[0]}  password {ADMIN[2]}")
        for phone, _name, password in CUSTOMERS:
            self.stdout.write(f"  Customer {phone}  password {password}")
        for phone, *_ in WORKERS:
            self.stdout.write(f"  Worker   {phone}  PIN {WORKER_PIN}")
