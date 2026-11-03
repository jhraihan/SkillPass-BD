from django.contrib import admin

from .models import Area, District, Division, ServiceCategory, Skill


class SkillInline(admin.TabularInline):
    model = Skill
    extra = 0
    fields = ("name_en", "name_bn", "slug", "sort_order", "is_active")
    prepopulated_fields = {"slug": ("name_en",)}


@admin.register(ServiceCategory)
class ServiceCategoryAdmin(admin.ModelAdmin):
    list_display = ("name_en", "name_bn", "slug", "icon", "sort_order", "is_active")
    list_editable = ("sort_order", "is_active")
    search_fields = ("name_en", "name_bn", "slug")
    prepopulated_fields = {"slug": ("name_en",)}
    inlines = [SkillInline]


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ("name_en", "name_bn", "category", "slug", "is_active")
    list_filter = ("category", "is_active")
    search_fields = ("name_en", "name_bn", "slug")
    prepopulated_fields = {"slug": ("name_en",)}


@admin.register(Area)
class AreaAdmin(admin.ModelAdmin):
    list_display = ("name_en", "name_bn", "district", "slug", "is_active")
    list_filter = ("district", "is_active")
    search_fields = ("name_en", "name_bn", "slug")
    prepopulated_fields = {"slug": ("name_en",)}


@admin.register(District)
class DistrictAdmin(admin.ModelAdmin):
    list_display = ("name_en", "name_bn", "division", "slug")
    prepopulated_fields = {"slug": ("name_en",)}


@admin.register(Division)
class DivisionAdmin(admin.ModelAdmin):
    list_display = ("name_en", "name_bn", "slug")
    prepopulated_fields = {"slug": ("name_en",)}
