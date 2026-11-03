from django.core.management.base import BaseCommand

from apps.trust.services import recalculate
from apps.workers.models import WorkerProfile


class Command(BaseCommand):
    help = "Recalculate the trust score of every worker."

    def handle(self, *args, **options):
        workers = WorkerProfile.objects.all()
        for worker in workers:
            recalculate(worker, trigger="manual_recalculation")
        self.stdout.write(f"Recalculated {workers.count()} worker(s).")
