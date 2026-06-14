from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        # MQTT persistence is handled by mqtt_gateway_to_server.py, which is
        # started as a separate supervisor program. Starting another actuator
        # subscriber inside Django would duplicate RawActuatorMonitor rows and
        # actuator_data.csv entries.
        return
