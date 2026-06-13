import json
import os
import threading
import time
import paho.mqtt.client as mqtt

ACTUATOR_DATA_TOPIC = "farm/monitor/actuator"


def _on_connect(client, userdata, flags, rc):
    if rc == 0:
        client.subscribe(ACTUATOR_DATA_TOPIC)
        print(f"[MQTT Sub] Connected, subscribed to {ACTUATOR_DATA_TOPIC}")
    else:
        print(f"[MQTT Sub] Connection failed rc={rc}")


def _on_message(client, userdata, msg):
    try:
        data = json.loads(msg.payload.decode())
    except Exception as e:
        print(f"[MQTT Sub] Bad payload: {e}")
        return

    if data.get("operator") != "actuator_data":
        return

    info = data.get("info", {})
    act = info.get("actuator_data") or info
    fan_speed = act.get("fan_speed", act.get("mode", "unknown"))

    # Django ORM is safe to use from a background thread after setup is done.
    from .models import RawActuatorMonitor, Room

    node_id = info.get("node_id")
    room_id_val = info.get("room_id")
    pwm = act.get("pwm", 0)
    state = act.get("state", act.get("status", 0))
    timestamp = int(time.time())

    room = Room.objects.filter(room_id=room_id_val).first()
    if room is None:
        print(f"[MQTT Sub] Room {room_id_val} not found, skipping save")
        return

    RawActuatorMonitor.objects.create(
        room_id=room,
        node_id=node_id,
        function=act.get("function", info.get("actuator_function", "fan")),
        current_value=str(pwm),
        state=state,
        mode=fan_speed,
        time=timestamp,
    )
    print(
        f"[MQTT Sub] Saved fan status: node={node_id} "
        f"state={state} speed={fan_speed} pwm={pwm} "
        f"server_received_time={timestamp}"
    )


def start_mqtt_subscriber():
    broker = os.environ.get("SERVER_BROKER", "localhost")
    port = 1883

    client = mqtt.Client()
    client.on_connect = _on_connect
    client.on_message = _on_message

    def _run():
        while True:
            try:
                client.connect(broker, port, keepalive=60)
                client.loop_forever()
            except Exception as e:
                print(f"[MQTT Sub] Connection error: {e}, retrying in 10s")
                time.sleep(10)

    t = threading.Thread(target=_run, daemon=True, name="mqtt-fan-subscriber")
    t.start()
