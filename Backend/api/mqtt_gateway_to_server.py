import multiprocessing
import json
import psycopg2
import time
import requests
import os
from dotenv import load_dotenv
from mqtt_class import ClientMQTT

try:
    from csv_recorder import append_actuator_record, append_sensor_record
except ImportError:
    from .csv_recorder import append_actuator_record, append_sensor_record

load_dotenv()

_ONE_SECOND = 1
_ONE_MINUTE = 60 * _ONE_SECOND
_ONE_HOUR = 60 * _ONE_MINUTE

backend_topic_dictionary = {
                        "sensor_data":  "farm/monitor/sensor",
                        "actuator_data":"farm/monitor/actuator",
                        "health_check": "farm/monitor/alive",
                        # WiFi things topics (direct from hardware via broker)
                        "scan_device": "farm/node/scan",
                        "keepalive_ack":   "farm/monitor/alive",
                        }

broker = os.environ.get('SERVER_BROKER')
port = 1883
UNASSIGNED_WIFI_ROOM_IDS = {0, 255}
DEFAULT_WIFI_ROOM_ID = os.environ.get("DEFAULT_WIFI_ROOM_ID", "407")

def _to_int(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return None

def _room_exists(cursor, room_id):
    room_id = _to_int(room_id)
    if room_id is None:
        return False

    cursor.execute("SELECT 1 FROM api_room WHERE room_id = %s LIMIT 1", (room_id,))
    return cursor.fetchone() is not None

def _resolve_wifi_room_id(cursor, mac, payload_room_id=None):
    payload_room_id = _to_int(payload_room_id)
    if (
        payload_room_id is not None
        and payload_room_id not in UNASSIGNED_WIFI_ROOM_IDS
        and _room_exists(cursor, payload_room_id)
    ):
        return payload_room_id

    cursor.execute(
        """SELECT room_id FROM api_registrationnode
           WHERE mac = %s AND room_id IS NOT NULL
           ORDER BY id DESC LIMIT 1""",
        (mac,),
    )
    row = cursor.fetchone()
    if row and _room_exists(cursor, row[0]):
        return row[0]

    cursor.execute(
        """SELECT room_id FROM api_nodeconfigurationbuffer
           WHERE mac = %s AND action = 1
           ORDER BY id DESC LIMIT 1""",
        (mac,),
    )
    row = cursor.fetchone()
    if row and _room_exists(cursor, row[0]):
        return row[0]

    cursor.execute(
        """SELECT room_id FROM api_scandevice
           WHERE mac = %s
           ORDER BY id DESC LIMIT 1""",
        (mac,),
    )
    row = cursor.fetchone()
    if row and _room_exists(cursor, row[0]):
        return row[0]

    default_room_id = _to_int(DEFAULT_WIFI_ROOM_ID)
    if _room_exists(cursor, default_room_id):
        return default_room_id

    cursor.execute("SELECT room_id FROM api_room ORDER BY id LIMIT 2")
    rooms = cursor.fetchall()
    if len(rooms) == 1:
        return rooms[0][0]

    return None

def _print_received_topic(topic):
    print(f"Received message from topic `{topic}`")

def DataForAqiRef():

    url = "https://api.waqi.info/feed/here/?token=08f2de731b94a1ff55e871514aa8f145e12ebafe"
    dict_key = [
        "aqi",
        "pm25",
        "pm10",
        "o3",
        "no2",
        "so2",
        "co",
        "t",
        "p",
        "h",
        "w",
        "dew",
        "wg",
    ]

    while True:

        try:
            data = requests.get(url)

            if data.status_code == 200:

                data_json = data.json()
                time_check = data_json["data"]["time"]["v"]
                data_save_to_database = {}

                try:
                    connect_to_database = psycopg2.connect(
                        database = os.environ.get('POSTGRES_DB'),
                        user = os.environ.get('POSTGRES_USER'),
                        password = os.environ.get('POSTGRES_PASSWORD'),
                        host = os.environ.get('HOST_NAME'),
                        port = "5432",
                    )
                    print("Successfully to connect database in function DataForAqiRef")
                except psycopg2.OperationalError as e:
                    connect_to_database = None
                    print(e)

                connect_to_database.autocommit = True
                cursor = connect_to_database.cursor()
                query = "SELECT time FROM api_aqiref ORDER BY time DESC"
                cursor.execute(query)
                all_data_in_aqiref_desc_time = cursor.fetchall()

                if len( all_data_in_aqiref_desc_time) == 0:
                    print("No data in aqiref. Able to save database")
                else:
                    print(all_data_in_aqiref_desc_time[0][0])
                    if (all_data_in_aqiref_desc_time[0][0] == time_check):
                        print("This time've already in database")
                        cursor.close()
                        connect_to_database.close()
                        time.sleep(_ONE_HOUR)
                        continue

                data_save_to_database["time"] = time_check

                for i in dict_key:

                    if i == "aqi":

                        if i in data_json["data"]:
                            data_save_to_database[i] = data_json["data"]["aqi"]
                        else:
                            data_save_to_database[i] = -1
                    
                    else:
                        print(i)
                        if i in data_json["data"]["iaqi"]:
                            data_save_to_database[i] = data_json["data"]["iaqi"][i]['v']
                        else:
                            data_save_to_database[i] = -1

                print(data_save_to_database)
                query = f"""INSERT INTO api_aqiref (time, aqi, pm25, pm10, o3, no2, so2, co, t, p, h, w, dew, wg) 
                        VALUES (%s, %s, %s, %s ,%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""
                record = ( data_save_to_database["time"], )
                for i in dict_key:
                    record = record + (data_save_to_database[i], )
                print(record)
                cursor.execute(query, record)
                print("Successfully insert AQI REF to PostgreSQL")
                cursor.close()
                connect_to_database.close()

        except:
            print("Error to get api aqiref!")
        time.sleep(2*_ONE_HOUR)

def DataFromSensorNode():

    client = ClientMQTT([backend_topic_dictionary["sensor_data"],])
    client.connect(broker, port)
    client.loop_start()

    while True:

        try:
            message_receive = client.message_arrive()

            if message_receive != None:
                _print_received_topic(backend_topic_dictionary["sensor_data"])
                print(f"Received `{message_receive}`")
                data_receive = json.loads(message_receive)

                if data_receive["operator"] == "sensor_data":
                    server_received_time = int(time.time())

                    try:
                        connect_to_database = psycopg2.connect(
                            database = os.environ.get('POSTGRES_DB'),
                            user = os.environ.get('POSTGRES_USER'),
                            password = os.environ.get('POSTGRES_PASSWORD'),
                            host = os.environ.get('HOST_NAME'),
                            port = "5432",
                        )
                        print("Successfully to connect database in function DataFromSensorNode")
                    except psycopg2.OperationalError as e:
                        connect_to_database = None
                        print(e)

                    connect_to_database.autocommit = True
                    cursor = connect_to_database.cursor()

                    info = data_receive["info"]
                    payload_room_id = info.get("room_id", 255)
                    payload_node_id = info.get("node_id")

                    # WiFi nodes send room_id=0 (pending assignment) or 255 (UNSUCCESSFUL_ID).
                    # Resolve the real room from the registration table using node_id so we
                    # never hit the FK constraint with an invalid value.
                    if payload_room_id in (0, 255) and payload_node_id is not None:
                        cursor.execute(
                            "SELECT room_id FROM api_registrationnode WHERE node_id = %s",
                            (payload_node_id,)
                        )
                        row = cursor.fetchone()
                        resolved_room_id = row[0] if row else None
                    else:
                        resolved_room_id = payload_room_id  # BLE mesh: already a valid room

                    query = """INSERT INTO api_rawsensormonitor
                                   (room_id, node_id, co2, temp, hum, light,
                                    dust, sound, red, green, blue, tvoc, motion, time)
                               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""
                    # Firmware sends "temperature"/"humidity"/"dust_density"; BLE mesh gateway
                    # sends "temp"/"hum"/"dust" — accept both.
                    def _get(key, *aliases):
                        for k in (key,) + aliases:
                            if k in info:
                                return info[k]
                        return -1

                    sensor_values = (
                        _get("co2"),
                        _get("temp", "temperature"),
                        _get("hum",  "humidity"),
                        _get("light"),
                        _get("dust", "dust_density"),
                        _get("sound"),
                        _get("red"),
                        _get("green"),
                        _get("blue"),
                        _get("tvoc"),
                        _get("motion"),
                    )
                    record = (resolved_room_id, payload_node_id) + sensor_values + (server_received_time,)

                    print(f"[Sensor] server_received_time={server_received_time}")
                    print(record)
                    cursor.execute(query, record)
                    print("Successfully insert RawSensorMonitor to PostgreSQL")
                    append_sensor_record(
                        {
                            "time": server_received_time,
                            "room_id": resolved_room_id,
                            "node_id": payload_node_id,
                            "co2": sensor_values[0],
                            "temp": sensor_values[1],
                            "hum": sensor_values[2],
                            "light": sensor_values[3],
                            "dust": sensor_values[4],
                            "sound": sensor_values[5],
                            "red": sensor_values[6],
                            "green": sensor_values[7],
                            "blue": sensor_values[8],
                            "tvoc": sensor_values[9],
                            "motion": sensor_values[10],
                        }
                    )
                    print("Successfully append sensor_data.csv")

                    if "state" in info or "pwm" in info:
                        actuator_query = """INSERT INTO api_rawactuatormonitor
                                               (room_id, node_id, function, current_value, state, mode, time)
                                           VALUES (%s, %s, %s, %s, %s, %s, %s)"""
                        actuator_record = (
                            resolved_room_id,
                            payload_node_id,
                            info.get("actuator_function", "fan"),
                            str(info.get("pwm", 0)),
                            info.get("state", info.get("status", 0)),
                            info.get("mode", info.get("fan_speed", "manual")),
                            server_received_time,
                        )
                        print(actuator_record)
                        cursor.execute(actuator_query, actuator_record)
                        print("Successfully insert RawActuatorMonitor from sensor_data to PostgreSQL")
                        append_actuator_record(
                            {
                                "time": server_received_time,
                                "room_id": resolved_room_id,
                                "node_id": payload_node_id,
                                "function": actuator_record[2],
                                "current_value": actuator_record[3],
                                "state": actuator_record[4],
                                "mode": actuator_record[5],
                            }
                        )
                        print("Successfully append actuator_data.csv from sensor_data")

                    cursor.close()
                    connect_to_database.close()
                elif data_receive["operator"] == "energy_data":

                    try:
                        connect_to_database = psycopg2.connect(
                            database = os.environ.get('POSTGRES_DB'),
                            user = os.environ.get('POSTGRES_USER'),
                            password = os.environ.get('POSTGRES_PASSWORD'),
                            host = os.environ.get('HOST_NAME'),
                            port = "5432",
                        )
                        print("Successfully to connect database in function DataFromSensorNode")
                    except psycopg2.OperationalError as e:
                        connect_to_database = None
                        print(e)

                    connect_to_database.autocommit = True
                    cursor = connect_to_database.cursor()
                    query = f"""INSERT INTO api_energydata(room_id, node_id, voltage, current, active_power, power_factor,
                                                            frequency, active_energy, time)
                                VALUES (%s, %s, %s, %s, %s, %s ,%s, %s, %s)"""
                    dict_key = [
                        "room_id",
                        "node_id",
                        "voltage",
                        "current",
                        "active_power",
                        "power_factor",
                        "frequency",
                        "active_energy",
                        "time",
                    ]
                    record = ()
                    for i in dict_key:
                        if i in data_receive["info"]:
                            record = record + (data_receive["info"][i], )
                        else:
                            record = record + (-1, )
                    print(record)
                    cursor.execute(query, record)
                    print("Successfully insert EnergyData to PostgreSQL")
                    cursor.close()
                    connect_to_database.close()
                else:
                    print("Message doesn't belong to this function DataFromSensorNode")
        except json.JSONDecodeError:
            print("Lỗi: Dữ liệu nhận được không phải là JSON chuẩn!")
        except psycopg2.Error as e:
            print(f"Lỗi Database: {e}")
        except Exception as e:
            print(f"Lỗi không xác định: {e}")

def DataFromActuator():

    client = ClientMQTT([backend_topic_dictionary["actuator_data"]],)
    client.connect(broker, port)
    client.loop_start()

    while True:
        try:
            message_receive = client.message_arrive()

            if message_receive != None:
                _print_received_topic(backend_topic_dictionary["actuator_data"])
                print(f"Received `{message_receive}`")
                data_receive = json.loads(message_receive)

                if data_receive["operator"] == "actuator_data":
                    server_received_time = int(time.time())
                    info = data_receive["info"]
                    act = info.get("actuator_data") or info

                    try:
                        connect_to_database = psycopg2.connect(
                            database = os.environ.get('POSTGRES_DB'),
                            user = os.environ.get('POSTGRES_USER'),
                            password = os.environ.get('POSTGRES_PASSWORD'),
                            host = os.environ.get('HOST_NAME'),
                            port = "5432",
                        )
                        print("Successfully to connect database in function DataFromActuator")
                    except psycopg2.OperationalError as e:
                        connect_to_database = None
                        print(e)

                    connect_to_database.autocommit = True
                    cursor = connect_to_database.cursor()
                    query = """INSERT INTO api_rawactuatormonitor (room_id, node_id, function, current_value, state, mode, time)
                               VALUES (%s, %s, %s, %s, %s, %s, %s)"""
                    record = (
                        info.get("room_id", -1),
                        info.get("node_id", -1),
                        act.get("function", info.get("actuator_function", "fan")),
                        str(act.get("pwm", 0)),
                        act.get("state", act.get("status", 0)),
                        act.get("fan_speed", act.get("mode", "unknown")),
                        server_received_time,
                    )
                    print(
                        "[Actuator] Parsed status "
                        f"node_id={record[1]} room_id={record[0]} "
                        f"state={record[4]} pwm={record[3]} mode={record[5]} "
                        f"server_received_time={server_received_time}"
                    )
                    print(record)
                    cursor.execute(query, record)
                    print("Successfully insert RawActuatorMonitor to PostgreSQL")
                    append_actuator_record(
                        {
                            "time": server_received_time,
                            "room_id": record[0],
                            "node_id": record[1],
                            "function": record[2],
                            "current_value": record[3],
                            "state": record[4],
                            "mode": record[5],
                        }
                    )
                    print("Successfully append actuator_data.csv")
                    cursor.close()
                    connect_to_database.close()
                else:
                    print("Message doesn't belong to this function DataFromActuator")

        except:
            print("Something was wrong while inserting to database !!!")

def HealthCheckNode():

    client = ClientMQTT([backend_topic_dictionary["health_check"]],)
    client.connect(broker, port)
    client.loop_start()

    while True:
        try:
            message_receive = client.message_arrive()

            if message_receive != None:
                _print_received_topic(backend_topic_dictionary["health_check"])
                print(f"Received `{message_receive}`")
                data_receive = json.loads(message_receive)

                if data_receive["operator"] == "keepalive_node":
                    try:
                        connect_to_database = psycopg2.connect(
                            database = os.environ.get('POSTGRES_DB'),
                            user = os.environ.get('POSTGRES_USER'),
                            password = os.environ.get('POSTGRES_PASSWORD'),
                            host = os.environ.get('HOST_NAME'),
                            port = "5432",
                        )
                        print("Successfully to connect database in function DataFromActuator")
                    except psycopg2.OperationalError as e:
                        connect_to_database = None
                        print(e)

                    connect_to_database.autocommit = True
                    cursor = connect_to_database.cursor()
                    query = f"""UPDATE api_registrationnode SET status = %s WHERE node_id = %s"""
                    record = (data_receive["info"]["node_status"],data_receive["info"]["node_id"])
                    print(record)
                    cursor.execute(query, record)
                    print("Successfully update api_registrationnode to PostgreSQL")
                    cursor.close()
                    connect_to_database.close()
                else:
                    print("Message doesn't belong to this function HealthCheckNode")

        except:
            print("Something was wrong while inserting to database !!!")

# ── WiFi node registration ───────────────────────────────────────
# Listens on farm/node/scan for 'register' messages from WiFi hardware.
# Saves each new device to api_registrationnode so the server knows about it.
# The gateway (gw2sv.py) also listens to this topic to send register_ack.
def RegisterWiFiNode():

    client = ClientMQTT([backend_topic_dictionary["scan_device"]],)
    client.connect(broker, port)
    client.loop_start()

    while True:
        try:
            message_receive = client.message_arrive()

            if message_receive is not None:
                _print_received_topic(backend_topic_dictionary["scan_device"])
                print(f"[WiFi] Received register `{message_receive}`")
                data_receive = json.loads(message_receive)

                if data_receive["operator"] == "register":
                    info = data_receive["info"]

                    try:
                        connect_to_database = psycopg2.connect(
                            database = os.environ.get('POSTGRES_DB'),
                            user     = os.environ.get('POSTGRES_USER'),
                            password = os.environ.get('POSTGRES_PASSWORD'),
                            host     = os.environ.get('HOST_NAME'),
                            port     = "5432",
                        )
                        print("Successfully connected to database in RegisterWiFiNode")
                    except psycopg2.OperationalError as e:
                        print(e)
                        continue

                    connect_to_database.autocommit = True
                    cursor = connect_to_database.cursor()

                    mac_raw = info.get('mac_address')
                    if mac_raw is None:
                        print("[WiFi] Register ignored: missing mac_address")
                        cursor.close()
                        connect_to_database.close()
                        continue

                    mac = str(mac_raw)
                    desired_room_id = _resolve_wifi_room_id(cursor, mac, info.get("room_id"))

                    # Also fetch room_id so the ack reflects whatever the admin assigned.
                    cursor.execute(
                        "SELECT id, node_id, room_id FROM api_registrationnode WHERE mac = %s",
                        (mac,)
                    )
                    existing = cursor.fetchone()

                    if existing:
                        row_id, row_node_id, row_room_id = existing

                        # If node_id was never persisted or is out of uint8_t range, assign one now.
                        if row_node_id is None or row_node_id > 254:
                            cursor.execute(
                                """SELECT COALESCE(MIN(s.i), 1)
                                   FROM generate_series(1, 254) AS s(i)
                                   WHERE s.i NOT IN (
                                       SELECT node_id FROM api_registrationnode
                                       WHERE node_id BETWEEN 1 AND 254
                                   )"""
                            )
                            row_node_id = cursor.fetchone()[0]
                            cursor.execute(
                                "UPDATE api_registrationnode SET node_id = %s WHERE id = %s",
                                (row_node_id, row_id)
                            )

                        assigned_node_id = row_node_id
                        ack_room_id = (
                            desired_room_id
                            if desired_room_id is not None
                            else row_room_id if row_room_id is not None else 0
                        )
                        if desired_room_id is not None and row_room_id != desired_room_id:
                            cursor.execute(
                                "UPDATE api_registrationnode SET room_id = %s WHERE id = %s",
                                (desired_room_id, row_id)
                            )
                        print(f"[WiFi] Re-registration mac={mac} node_id={assigned_node_id} room_id={ack_room_id}")
                    else:
                        # New device: find the lowest free node_id in 1-254 (firmware uint8_t limit).
                        cursor.execute(
                            """SELECT COALESCE(MIN(s.i), 1)
                               FROM generate_series(1, 254) AS s(i)
                               WHERE s.i NOT IN (
                                   SELECT node_id FROM api_registrationnode
                                   WHERE node_id BETWEEN 1 AND 254
                               )"""
                        )
                        assigned_node_id = cursor.fetchone()[0]
                        cursor.execute(
                            """INSERT INTO api_registrationnode
                                   (room_id, node_id, mac, status, time, x_axis, y_axis, z_axis, function)
                               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                            (desired_room_id, assigned_node_id, mac, 'sync', int(time.time()), 1, 1, 1,
                             info.get('node_function', 'None'))
                        )
                        ack_room_id = desired_room_id if desired_room_id is not None else 0
                        print(
                            f"[WiFi] Registered new node mac={mac} "
                            f"node_id={assigned_node_id} room_id={ack_room_id}"
                        )

                    cursor.close()
                    connect_to_database.close()

                    # Publish register_ack on farm/node/add.
                    # Firmware exits its registration loop once it receives this and sets
                    # its internal node_id / room_id to the values we send here.
                    ack = {
                        'operator': 'register_ack',
                        'status': 1,
                        'info': {
                            'mac_address': mac,
                            'node_id': assigned_node_id,
                            'room_id': ack_room_id,
                            'time': int(time.time()),
                        }
                    }
                    client.publish('farm/node/add', json.dumps(ack))
                    print(f"[WiFi] register_ack → node_id={assigned_node_id} room_id={ack_room_id} mac={mac}")

        except json.JSONDecodeError:
            print("[WiFi] RegisterWiFiNode: invalid JSON received")
        except psycopg2.Error as e:
            print(f"[WiFi] RegisterWiFiNode DB error: {e}")
        except Exception as e:
            print(f"[WiFi] RegisterWiFiNode error: {e}")
# ─────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    process_list = []
    process_list.append(multiprocessing.Process(target = DataFromSensorNode))
    process_list.append(multiprocessing.Process(target = DataFromActuator))
    process_list.append(multiprocessing.Process(target = DataForAqiRef))
    process_list.append(multiprocessing.Process(target = HealthCheckNode))
    process_list.append(multiprocessing.Process(target = RegisterWiFiNode))  # WiFi node registration

    for i in process_list:
        i.start()
    for i in process_list:
        i.join()
