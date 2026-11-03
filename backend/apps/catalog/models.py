from django.db import models

from common.models import TimeStampedModel


class NamedModel(models.Model):
    name_en = models.CharField(max_length=100)
    name_bn = models.CharField(max_length=100)
    slug = models.SlugField(max_length=60, unique=True)

    class Meta:
        abstract = True

    def __str__(self):
        return self.name_en


class Division(NamedModel):
    class Meta:
        ordering = ["name_en"]


class District(NamedModel):
    division = models.ForeignKey(Division, on_delete=models.PROTECT, related_name="districts")

    class Meta:
        ordering = ["name_en"]


class Area(NamedModel, TimeStampedModel):
    district = models.ForeignKey(District, on_delete=models.PROTECT, related_name="areas")
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name_en"]


class ServiceCategory(NamedModel, TimeStampedModel):
    icon = models.CharField(max_length=40, blank=True)
    sort_order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["sort_order", "name_en"]
        verbose_name_plural = "service categories"


class Skill(NamedModel, TimeStampedModel):
    category = models.ForeignKey(ServiceCategory, on_delete=models.PROTECT, related_name="skills")
    sort_order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["category__sort_order", "sort_order", "name_en"]
