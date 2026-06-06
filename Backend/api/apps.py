import os

from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        # Start the MQTT subscriber that persists fan-status reports
        # (topic farm/monitor/actuator) into RawActuatorMonitor.
        #
        # It needs the Django ORM, so unlike mqtt_gateway_to_server.py (which
        # runs as its own supervisor process via raw psycopg2) it must live
        # inside the Django process. `runserver` (used in supervisor.conf) runs
        # with the autoreloader: the parent watcher has RUN_MAIN unset and the
        # child that actually serves requests has RUN_MAIN=='true'. Management
        # commands like `migrate` also trigger ready(). Gating on
        # RUN_MAIN=='true' starts exactly one subscriber and avoids opening a
        # broker connection during migrations.
        if os.environ.get('RUN_MAIN') != 'true':
            return
        from .mqtt_subscriber import start_mqtt_subscriber
        start_mqtt_subscriber()
