from django.db import transaction

_listeners = []


def on_transition(listener):
    _listeners.append(listener)
    return listener


def emit(booking, from_status, to_status, actor):
    for listener in list(_listeners):
        transaction.on_commit(
            lambda listener=listener: listener(booking, from_status, to_status, actor)
        )
