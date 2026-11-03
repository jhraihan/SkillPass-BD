from django.db import migrations

from apps.catalog.services import seed_catalog


def load(apps, schema_editor):
    names = ["Division", "District", "Area", "ServiceCategory", "Skill"]
    seed_catalog([apps.get_model("catalog", name) for name in names])


class Migration(migrations.Migration):
    dependencies = [
        ("catalog", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(load, migrations.RunPython.noop),
    ]
