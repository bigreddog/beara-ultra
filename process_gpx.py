import xml.etree.ElementTree as ET
import math
import json

def haversine(lat1, lon1, lat2, lon2):
    R = 6371000  # radius of Earth in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2)**2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def parse_gpx(file_path, reverse=False):
    tree = ET.parse(file_path)
    root = tree.getroot()

    # Handle namespaces
    ns = {'gpx': 'http://www.topografix.com/GPX/1/1'}

    raw_points = root.findall('.//gpx:trkpt', ns)

    if reverse:
        raw_points = raw_points[::-1]
        print("Reversing route points...")

    track_points = []
    total_dist = 0
    prev_pt = None

    # Step for downsampling
    step = 7

    for i, trkpt in enumerate(raw_points):
        lat = float(trkpt.get('lat'))
        lon = float(trkpt.get('lon'))
        ele_elem = trkpt.find('gpx:ele', ns)
        ele = float(ele_elem.text) if ele_elem is not None else 0

        if prev_pt:
            dist = haversine(prev_pt[0], prev_pt[1], lat, lon)
            total_dist += dist

        if i % step == 0 or i == len(raw_points) - 1:
            track_points.append({
                'lat': lat,
                'lon': lon,
                'ele': ele,
                'dist': total_dist / 1000.0 # in km
            })

        prev_pt = (lat, lon)

    return track_points

# 2025 direction is CCW, so we reverse the CW GPX
data = parse_gpx('IMRA Beara Way Ultra.gpx', reverse=True)
with open('route_data.json', 'w') as f:
    json.dump(data, f)

print(f"Extracted {len(data)} points. Total distance: {data[-1]['dist']:.2f} km")
