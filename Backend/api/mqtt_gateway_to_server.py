import multiprocessing
import json
import psycopg2
import time
import requests
import os
from dotenv import load_dotenv
from mqtt_class import ClientMQTT

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
                print(f"Received `{message_receive}`")
                data_receive = json.loads(message_receive)

                if data_receive["operator"] == "sensor_data":

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
                    record = (resolved_room_id, payload_node_id) + sensor_values + (int(time.time()),)

                    print(record)
                    cursor.execute(query, record)
                    print("Successfully insert RawSensorMonitor to PostgreSQL")
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
                print(f"Received `{message_receive}`")
                data_receive = json.loads(message_receive)

                if data_receive["operator"] == "actuator_data":
                    info = data_receive["info"]
                    act  = info.get("actuator_data", {})

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
                        "fan",
                        str(act.get("pwm", 0)),
                        act.get("state", 0),
                        act.get("fan_speed", "unknown"),
                        info.get("time", int(time.time())),
                    )
                    print(record)
                    cursor.execute(query, record)
                    print("Successfully insert RawActuatorMonitor to PostgreSQL")
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

                    mac = info.get('mac_address')

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
                        ack_room_id = row_room_id if row_room_id is not None else 0
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
                            (None, assigned_node_id, mac, 'sync', int(time.time()), 1, 1, 1,
                             info.get('node_function', 'None'))
                        )
                        ack_room_id = 0  # no room yet; admin assigns later via the web UI
                        print(f"[WiFi] Registered new node mac={mac} node_id={assigned_node_id}")

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
