import xml.etree.ElementTree as ET
import math
import json

def haversine(lat1, lon1, lat2, lon2):
    R = 6371000  # radius of Earth in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2)**2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2)**2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def process_gpx(filepath):
    tree = ET.parse(filepath)
    root = tree.getroot()

    # Namespaces
    ns = {'gpx': 'http://www.topografix.com/GPX/1/1'}

    points = []
    for trk in root.findall('gpx:trk', ns):
        for trkseg in trk.findall('gpx:trkseg', ns):
            for trkpt in trkseg.findall('gpx:trkpt', ns):
                lat = float(trkpt.get('lat'))
                lon = float(trkpt.get('lon'))
                ele_node = trkpt.find('gpx:ele', ns)
                ele = float(ele_node.text) if ele_node is not None else 0
                points.append({'lat': lat, 'lon': lon, 'ele': ele})

    if not points:
        return None

    # Calculate cumulative distance
    total_dist = 0
    points[0]['dist'] = 0
    for i in range(1, len(points)):
        d = haversine(points[i-1]['lat'], points[i-1]['lon'], points[i]['lat'], points[i]['lon'])
        total_dist += d
        points[i]['dist'] = total_dist

    print(f"Total distance: {total_dist/1000:.2f} km")

    # Downsample to ~1000 points
    target_count = 1000
    step = max(1, len(points) // target_count)
    downsampled = points[::step]
    if downsampled[-1] != points[-1]:
        downsampled.append(points[-1])

    return {
        'total_dist_km': total_dist / 1000,
        'points': downsampled
    }

if __name__ == "__main__":
    data = process_gpx('IMRA Beara Way Ultra-reversed.gpx')
    if data:
        with open('route_data.json', 'w') as f:
            json.dump(data, f)
        print("Processed GPX and saved to route_data.json")
