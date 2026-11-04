from .models import Notification

N = Notification.Type

TEMPLATES = {
    N.NEW_JOB: {
        "bn": ("নতুন কাজ: {category}, {area}", "দেখতে ও গ্রহণ করতে চাপুন।"),
        "en": ("New job: {category}, {area}", "Tap to see and accept it."),
    },
    N.BOOKING_ACCEPTED: {
        "bn": ("{name} আপনার কাজ গ্রহণ করেছেন", "{category} — এখন কল করতে পারবেন।"),
        "en": ("{name} accepted your job", "{category} — you can call them now."),
    },
    N.BOOKING_DECLINED: {
        "bn": ("{name} কাজটি নিতে পারছেন না", "অন্য একজন কর্মী বেছে নিন।"),
        "en": ("{name} cannot take your job", "Please choose another worker."),
    },
    N.BOOKING_EXPIRED: {
        "bn": ("{name} সময়মতো উত্তর দেননি", "অন্য একজন কর্মী বেছে নিন।"),
        "en": ("{name} did not answer in time", "Please choose another worker."),
    },
    N.BOOKING_CANCELLED: {
        "bn": ("কাজ বাতিল হয়েছে: {category}", "{reason}"),
        "en": ("Job cancelled: {category}", "{reason}"),
    },
    N.WORKER_ON_THE_WAY: {
        "bn": ("{name} রওনা দিয়েছেন", "{category} — শীঘ্রই পৌঁছাবেন।"),
        "en": ("{name} is on the way", "{category} — arriving soon."),
    },
    N.JOB_STARTED: {
        "bn": ("{name} কাজ শুরু করেছেন", "{category}"),
        "en": ("{name} started the job", "{category}"),
    },
    N.CONFIRM_COMPLETION: {
        "bn": ("কাজ শেষ হয়েছে কি?", "{name} বলছেন কাজ শেষ। নিশ্চিত করুন বা সমস্যা জানান।"),
        "en": ("Is the job done?", "{name} says the job is finished. Confirm or report a problem."),
    },
    N.JOB_COMPLETED: {
        "bn": ("কাজ নিশ্চিত হয়েছে: {category}", "গ্রাহক কাজ শেষ নিশ্চিত করেছেন।"),
        "en": ("Job confirmed: {category}", "The customer confirmed the job is done."),
    },
    N.JOB_AUTO_CLOSED: {
        "bn": ("কাজ বন্ধ হয়েছে: {category}", "গ্রাহক উত্তর দেননি, তাই কাজটি বন্ধ করা হয়েছে।"),
        "en": ("Job closed: {category}", "The customer did not answer, so the job was closed."),
    },
    N.BOOKING_DISPUTED: {
        "bn": ("কাজ নিয়ে সমস্যা জানানো হয়েছে", "{category} — স্কিলপাস টিম দেখবে।"),
        "en": ("A problem was reported with a job", "{category} — the SkillPass team will check."),
    },
    N.DISPUTE_RESOLVED: {
        "bn": ("সমস্যার সমাধান হয়েছে: {category}", "{reason}"),
        "en": ("Problem resolved: {category}", "{reason}"),
    },
    N.REVIEW_RECEIVED: {
        "bn": ("নতুন রিভিউ: {stars} তারা", "{category}"),
        "en": ("New review: {stars} stars", "{category}"),
    },
    N.VERIFICATION_APPROVED: {
        "bn": ("আপনার কাগজ অনুমোদিত হয়েছে", "{subject}"),
        "en": ("Your documents were approved", "{subject}"),
    },
    N.VERIFICATION_REJECTED: {
        "bn": ("আপনার কাগজ গ্রহণ করা হয়নি", "{reason}"),
        "en": ("Your documents were not accepted", "{reason}"),
    },
}


class _Params(dict):
    def __missing__(self, key):
        return ""


def _localize(value, language):
    if isinstance(value, dict):
        return value.get(f"name_{language}") or value.get("name_en") or ""
    return value


def render(notification_type, language, data):
    templates = TEMPLATES[notification_type]
    title, body = templates.get(language) or templates["en"]
    params = _Params({key: _localize(value, language) for key, value in data.items()})
    return title.format_map(params)[:150], body.format_map(params).strip()[:300]
