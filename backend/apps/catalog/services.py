from django.db import transaction
from django.utils.text import slugify

from .seed_data import AREAS, CATEGORIES, DISTRICTS, DIVISIONS, SKILLS


def unique_slug(model, text, exclude_pk=None):
    base = slugify(text)[:50] or "item"
    slug, counter = base, 2
    existing = model.objects.exclude(pk=exclude_pk)
    while existing.filter(slug=slug).exists():
        slug, counter = f"{base}-{counter}", counter + 1
    return slug


@transaction.atomic
def seed_catalog(models):
    division_model, district_model, area_model, category_model, skill_model = models

    divisions = {
        slug: division_model.objects.update_or_create(
            slug=slug, defaults={"name_en": en, "name_bn": bn}
        )[0]
        for slug, en, bn in DIVISIONS
    }
    districts = {
        slug: district_model.objects.update_or_create(
            slug=slug, defaults={"division": divisions[division], "name_en": en, "name_bn": bn}
        )[0]
        for division, slug, en, bn in DISTRICTS
    }
    for district, slug, en, bn in AREAS:
        area_model.objects.update_or_create(
            slug=slug, defaults={"district": districts[district], "name_en": en, "name_bn": bn}
        )

    categories = {}
    for order, (slug, en, bn, icon) in enumerate(CATEGORIES, start=1):
        categories[slug] = category_model.objects.update_or_create(
            slug=slug, defaults={"name_en": en, "name_bn": bn, "icon": icon, "sort_order": order}
        )[0]
    for order, (category, slug, en, bn) in enumerate(SKILLS, start=1):
        skill_model.objects.update_or_create(
            slug=slug,
            defaults={
                "category": categories[category],
                "name_en": en,
                "name_bn": bn,
                "sort_order": order,
            },
        )
