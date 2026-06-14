import csv
import os
import threading
from datetime import datetime


_CSV_LOCK = threading.Lock()
_BACKEND_DIR = os.path.dirname(os.path.dirname(__file__))
_DEFAULT_RECORD_DIR = os.path.join(_BACKEND_DIR, "exported_csv", "mqtt_records")

SENSOR_CSV_HEADERS = [
    "readable_received_time",
    "received_time",
    "operator",
    "mac_address",
    "node_id",
    "room_id",
    "packet_time",
    "packet_id",
    "temperature",
    "humidity",
    "protocol",
    "co2",
    "dust_density",
    "motion",
]

ACTUATOR_CSV_HEADERS = [
    "readable_received_time",
    "received_time",
    "operator",
    "mac_address",
    "node_id",
    "room_id",
    "packet_time",
    "protocol",
    "state",
    "pwm",
]


def readable_timestamp(timestamp):
    try:
        timestamp = int(timestamp)
    except (TypeError, ValueError):
        timestamp = int(datetime.now().timestamp())
    return datetime.fromtimestamp(timestamp).strftime("%d/%m/%Y %H:%M:%S")


def _record_dir():
    return os.environ.get("MQTT_RECORD_CSV_DIR") or _DEFAULT_RECORD_DIR


def _append_csv(filename, headers, row):
    csv_dir = _record_dir()
    os.makedirs(csv_dir, exist_ok=True)
    csv_path = os.path.join(csv_dir, filename)

    with _CSV_LOCK:
        if os.path.exists(csv_path) and os.path.getsize(csv_path) > 0:
            with open(csv_path, mode="r", newline="", encoding="utf-8") as csv_file:
                current_header = next(csv.reader(csv_file), [])
            if current_header != headers:
                legacy_name = (
                    f"{os.path.splitext(filename)[0]}_legacy_"
                    f"{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
                )
                os.replace(csv_path, os.path.join(csv_dir, legacy_name))

        should_write_header = not os.path.exists(csv_path) or os.path.getsize(csv_path) == 0
        with open(csv_path, mode="a", newline="", encoding="utf-8") as csv_file:
            writer = csv.DictWriter(csv_file, fieldnames=headers, extrasaction="ignore")
            if should_write_header:
                writer.writeheader()
            writer.writerow({key: row.get(key, "") for key in headers})


def append_sensor_record(record):
    row = dict(record)
    row["readable_received_time"] = readable_timestamp(row.get("received_time"))
    _append_csv("sensor_data.csv", SENSOR_CSV_HEADERS, row)


def append_actuator_record(record):
    row = dict(record)
    row["readable_received_time"] = readable_timestamp(row.get("received_time"))
    _append_csv("actuator_data.csv", ACTUATOR_CSV_HEADERS, row)
