import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# Helper function to authenticate
def get_auth_headers():
    response = client.post(
        "/api/auth/login",
        data={"username": "ananya@ecosphere.ai", "password": "password"}
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "EcoSphere AI" in response.json()["message"]

def test_auth_flow():
    # Login
    response = client.post(
        "/api/auth/login",
        data={"username": "ananya@ecosphere.ai", "password": "password"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

    # Profile
    headers = {"Authorization": f"Bearer {data['access_token']}"}
    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 200
    user_data = response.json()
    assert user_data["email"] == "ananya@ecosphere.ai"
    assert user_data["name"] == "Ananya Sharma"

def test_carbon_endpoints():
    headers = get_auth_headers()

    # Create manual entry
    payload = {
        "category": "Transport",
        "details": {"mode": "car_petrol", "distance": 150}
    }
    response = client.post("/api/carbon/calculate", json=payload, headers=headers)
    assert response.status_code == 200
    assert "footprint" in response.json()
    assert response.json()["footprint"] == 27.0  # 150 * 0.18

    # Get history
    response = client.get("/api/carbon/history", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) >= 1

    # Get dashboard
    response = client.get("/api/carbon/dashboard", headers=headers)
    assert response.status_code == 200
    dash_data = response.json()
    assert "weekly_total" not in dash_data  # Wait, let's verify dashboard fields: total_footprint, daily_average...
    assert "total_footprint" in dash_data
    assert "daily_average" in dash_data

def test_incident_endpoints():
    headers = get_auth_headers()

    # Create incident
    payload = {
        "location_text": "Cubbon Park Entrance, Bengaluru",
        "category": "Plastic Waste",
        "latitude": 12.9716,
        "longitude": 77.5946,
        "description": "Garbage dump near Cubbon Park metro station entrance",
        "severity": "Medium"
    }
    response = client.post("/api/incident/report", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["category"] == "Plastic Waste"
    assert data["status"] == "Submitted"

    # Get all reports
    response = client.get("/api/incident/all", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) >= 1

def test_gamification_endpoints():
    headers = get_auth_headers()

    # Get active challenges
    response = client.get("/api/gamification/challenge/active", headers=headers)
    assert response.status_code == 200
    challenges = response.json()
    assert len(challenges) >= 1

    # Get leaderboard
    response = client.get("/api/gamification/leaderboard", headers=headers)
    assert response.status_code == 200
    leaderboard = response.json()
    assert len(leaderboard) >= 1

def test_events_endpoints():
    headers = get_auth_headers()

    # Get all events
    response = client.get("/api/events/all", headers=headers)
    assert response.status_code == 200
    events = response.json()
    assert len(events) >= 1

def test_ai_endpoints():
    headers = get_auth_headers()

    # Get recommendations via POST
    response = client.post("/api/recommendation", headers=headers)
    assert response.status_code == 200
    recs = response.json()
    assert len(recs) == 3
    assert recs[0]["id"].startswith("rec_")

    # Chatbot response
    payload = {
        "history": [],
        "message": "How do I reduce carbon emissions?"
    }
    response = client.post("/api/chatbot", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    assert len(data["response"]) > 0

def test_profile_update():
    headers = get_auth_headers()
    
    # 1. Update name
    payload = {"name": "Ananya Sharma Updated"}
    response = client.put("/api/auth/update", json=payload, headers=headers)
    assert response.status_code == 200
    assert response.json()["name"] == "Ananya Sharma Updated"
    
    # Reset name back to avoid disrupting other tests
    client.put("/api/auth/update", json={"name": "Ananya Sharma"}, headers=headers)

    # 2. Validation: Short password check
    response = client.put("/api/auth/update", json={"password": "short"}, headers=headers)
    assert response.status_code == 400
    assert "password" in response.json()["detail"].lower()

    # 3. Validation: Short name check
    response = client.put("/api/auth/update", json={"name": "A"}, headers=headers)
    assert response.status_code == 400
    assert "name" in response.json()["detail"].lower()
