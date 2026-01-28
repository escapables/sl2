"""
Swedish Commute Dashboard - Flask Backend
Proxies requests to ResRobot API
"""

import requests
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

# ResRobot API endpoints
RESROBOT_BASE = "https://api.resrobot.se/v2.1"


def get_api_key():
    """Get API key from request header."""
    return request.headers.get("X-API-Key", "")


@app.route("/")
def index():
    """Serve the main dashboard page."""
    return render_template("index.html")


@app.route("/api/search")
def search_locations():
    """Search for stops/locations by name."""
    query = request.args.get("q", "")
    api_key = get_api_key()

    if not query:
        return jsonify({"error": "Missing query parameter 'q'"}), 400

    if not api_key:
        return jsonify({"error": "API key not configured"}), 401

    url = f"{RESROBOT_BASE}/location.name"
    params = {"input": query, "format": "json", "accessId": api_key, "lang": "en"}

    try:
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        return jsonify(resp.json())
    except requests.RequestException as e:
        return jsonify({"error": str(e)}), 502


@app.route("/api/nearby")
def nearby_stops():
    """Find stops near given coordinates."""
    lat = request.args.get("lat")
    lon = request.args.get("lon")
    api_key = get_api_key()

    if not lat or not lon:
        return jsonify({"error": "Missing lat or lon parameters"}), 400

    if not api_key:
        return jsonify({"error": "API key not configured"}), 401

    url = f"{RESROBOT_BASE}/location.nearbystops"
    params = {
        "originCoordLat": lat,
        "originCoordLong": lon,
        "format": "json",
        "accessId": api_key,
        "maxNo": 10,
        "r": 1000,
    }

    try:
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        return jsonify(resp.json())
    except requests.RequestException as e:
        return jsonify({"error": str(e)}), 502


@app.route("/api/route")
def get_route():
    """Get route between two stops."""
    origin_id = request.args.get("from")
    dest_id = request.args.get("to")
    date = request.args.get("date")
    time = request.args.get("time")
    api_key = get_api_key()

    print(f"Route request: from={origin_id}, to={dest_id}, date={date}, time={time}")

    if not origin_id or not dest_id:
        return jsonify({"error": "Missing from or to parameters"}), 400

    if not api_key:
        return jsonify({"error": "API key not configured"}), 401

    url = f"{RESROBOT_BASE}/trip"
    params = {
        "originId": origin_id,
        "destId": dest_id,
        "format": "json",
        "accessId": api_key,
        "lang": "en",
        "numF": 5,
    }

    if date:
        params["date"] = date
    if time:
        params["time"] = time

    try:
        resp = requests.get(url, params=params, timeout=15)

        print(f"Route API URL: {resp.url}")
        print(f"Route API status: {resp.status_code}")

        # Return the actual response from ResRobot
        if resp.status_code == 200:
            return jsonify(resp.json())
        else:
            # Pass through the error from ResRobot but return 200 so frontend can handle it
            error_text = resp.text[:500] if resp.text else "No error details"
            print(f"Route API error: {error_text}")
            return jsonify(
                {
                    "error": f"ResRobot API returned {resp.status_code}",
                    "status_code": resp.status_code,
                    "details": error_text,
                }
            ), 200

    except requests.Timeout:
        return jsonify({"error": "Request to ResRobot API timed out"}), 504
    except requests.RequestException as e:
        return jsonify({"error": str(e)}), 502


@app.route("/api/validate-key", methods=["POST"])
def validate_key():
    """Validate an API key by making a test request."""
    api_key = get_api_key()

    if not api_key:
        return jsonify({"error": "API key not provided"}), 400

    # Make a simple test request
    url = f"{RESROBOT_BASE}/location.name"
    params = {"input": "Stockholm", "format": "json", "accessId": api_key, "maxNo": 1}

    try:
        resp = requests.get(url, params=params, timeout=10)
        if resp.status_code == 200:
            return jsonify({"valid": True})
        elif resp.status_code == 401 or resp.status_code == 403:
            return jsonify({"valid": False, "error": "Invalid API key"}), 401
        else:
            return jsonify(
                {"valid": False, "error": f"API error: {resp.status_code}"}
            ), 502
    except requests.RequestException as e:
        return jsonify({"valid": False, "error": str(e)}), 502


@app.route("/api/test-route")
def test_route():
    """Test the route endpoint with sample data."""
    api_key = get_api_key()

    if not api_key:
        return jsonify({"error": "API key not provided"}), 400

    # Test with Stockholm Central (740000001) to Göteborg Central (740000002)
    url = f"{RESROBOT_BASE}/trip"
    params = {
        "originId": "740000001",
        "destId": "740000002",
        "format": "json",
        "accessId": api_key,
        "lang": "en",
        "numF": 1,
    }

    try:
        resp = requests.get(url, params=params, timeout=15)
        return jsonify(
            {
                "status_code": resp.status_code,
                "url": resp.url,
                "response_preview": resp.text[:1000] if resp.text else "Empty response",
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 502


if __name__ == "__main__":
    app.run(debug=True, port=5000)
