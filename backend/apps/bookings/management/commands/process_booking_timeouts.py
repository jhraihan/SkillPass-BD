from django.core.management.base import BaseCommand

from apps.bookings.services import process_timeouts


class Command(BaseCommand):
    help = "Expire unanswered booking requests and auto-close unconfirmed jobs."

    def handle(self, *args, **options):
        counts = process_timeouts()
        self.stdout.write(
            f"Expired {counts['expired']} booking(s), auto-closed {counts['auto_closed']}."
        )
