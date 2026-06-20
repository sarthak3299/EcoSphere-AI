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

def test_unauthorized_access():
    # Attempting to access endpoints without auth headers
    endpoints = [
        ("/api/carbon/history", "GET"),
        ("/api/carbon/dashboard", "GET"),
        ("/api/incident/all", "GET"),
        ("/api/gamification/challenge/active", "GET"),
        ("/api/events/all", "GET"),
    ]
    for url, method in endpoints:
        if method == "GET":
            response = client.get(url)
        assert response.status_code == 401
        assert "not authenticated" in response.json()["detail"].lower()

def test_invalid_signup():
    # Short password signup
    payload = {
        "email": "invalid_signup@ecosphere.ai",
        "password": "123",
        "name": "Invalid User"
    }
    response = client.post("/api/auth/signup", json=payload)
    assert response.status_code == 400
    assert "password" in response.json()["detail"].lower()

    # Short name signup
    payload = {
        "email": "invalid_signup@ecosphere.ai",
        "password": "valid_password",
        "name": "I"
    }
    response = client.post("/api/auth/signup", json=payload)
    assert response.status_code == 400
    assert "name" in response.json()["detail"].lower()

    # Invalid email signup
    payload = {
        "email": "invalid-email-format",
        "password": "valid_password",
        "name": "Invalid Email"
    }
    response = client.post("/api/auth/signup", json=payload)
    assert response.status_code == 422  # Pydantic EmailStr validation error

def test_invalid_event_operations():
    headers = get_auth_headers()

    # Join non-existing event
    response = client.post("/api/events/join/9999", headers=headers)
    assert response.status_code == 404
    assert "event not found" in response.json()["detail"].lower()

def test_invalid_challenge_operations():
    headers = get_auth_headers()

    # Join non-existing challenge
    response = client.post("/api/gamification/challenge/join/9999", headers=headers)
    assert response.status_code == 404
    assert "challenge not found" in response.json()["detail"].lower()

    # Update progress for non-joined challenge
    response = client.post("/api/gamification/challenge/update/9999?progress_delta=10", headers=headers)
    assert response.status_code == 404
    assert "not joined this challenge yet" in response.json()["detail"].lower()

def test_incident_payload_size_limit():
    headers = get_auth_headers()
    # Large image_data exceeding 10MB (10485760 characters)
    huge_data = "a" * (10485760 + 1)
    payload = {
        "location_text": "Test Location",
        "category": "Plastic Waste",
        "image_data": huge_data
    }
    response = client.post("/api/incident/report", json=payload, headers=headers)
    assert response.status_code == 422
    assert "less_than_equal" in response.text or "length" in response.text or "value_error" in response.text

def test_ai_service_fallbacks():
    from app.ai.ai_service import AIService

    # 1. Utility bill extraction fallbacks
    res_elec = AIService.analyze_utility_bill(b"", "my_electricity_bill.png")
    assert res_elec["utility_type"] == "Electricity"
    assert res_elec["consumption_value"] == 185.0

    res_water = AIService.analyze_utility_bill(b"", "water.jpg")
    assert res_water["utility_type"] == "Water"
    assert res_water["consumption_value"] == 1200.0

    res_fuel = AIService.analyze_utility_bill(b"", "fuel_receipt.png")
    assert res_fuel["utility_type"] == "Transport"
    assert res_fuel["consumption_value"] == 45.0

    res_generic = AIService.analyze_utility_bill(b"", "random.png")
    assert res_generic["utility_type"] == "Shopping"
    assert res_generic["consumption_value"] == 5.0

    # 2. Pollution image fallback
    res_pollution = AIService.classify_pollution_image(b"")
    assert res_pollution["category"] == "Garbage Dumping"
    assert res_pollution["severity"] == "Medium"

    # 3. Recommendations fallback
    recs = AIService.generate_recommendations({}, [])
    assert len(recs) == 3
    assert recs[0]["id"] == "rec_commute"

    # 4. Chatbot fallbacks
    chat_reduce = AIService.chatbot_response([], "How do I reduce my emissions?")
    assert "Here are 3 quick and highly effective ways" in chat_reduce

    chat_incident = AIService.chatbot_response([], "How do I report garbage?")
    assert "Incident Reporting" in chat_incident

    chat_game = AIService.chatbot_response([], "What games or quizzes do you have?")
    assert "Games" in chat_game or "Challenges" in chat_game

    chat_default = AIService.chatbot_response([], "Hello there!")
    assert "EcoBot AI" in chat_default

def test_incident_escalation():
    headers = get_auth_headers()
    # 1. Create a report
    payload = {
        "location_text": "Cubbon Park, Bengaluru",
        "category": "Air Pollution",
        "latitude": 12.9716,
        "longitude": 77.5946,
        "description": "Thick smoke from burning leaves",
        "severity": "High"
    }
    response = client.post("/api/incident/report", json=payload, headers=headers)
    assert response.status_code == 200
    report_id = response.json()["id"]

    # 2. Escalate report
    response = client.post(f"/api/incident/{report_id}/escalate", headers=headers)
    assert response.status_code == 200
    assert "escalated to Pollution Control Board" in response.json()["message"]
    assert response.json()["status"] == "Assigned"

    # 3. Escalate non-existing report
    response = client.post("/api/incident/9999/escalate", headers=headers)
    assert response.status_code == 404

def test_rate_limiter():
    headers = get_auth_headers()
    headers["X-Test-Rate-Limit"] = "True"
    status_codes = []
    # Send 10 quick requests to /api/auth/me. 6th and above should return 429.
    for _ in range(10):
        res = client.get("/api/auth/me", headers=headers)
        status_codes.append(res.status_code)
        if res.status_code == 429:
            break
            
    assert 429 in status_codes

def test_event_joining():
    headers = get_auth_headers()
    # Join event 1
    response = client.post("/api/events/join/1", headers=headers)
    assert response.status_code == 200
    assert response.json()["joined"] is True

    # Rejoin event 1 (idempotency check)
    response = client.post("/api/events/join/1", headers=headers)
    assert response.status_code == 200
    assert "already registered" in response.json()["message"]

def test_bill_upload():
    headers = get_auth_headers()
    # Upload simulated file
    files = {"file": ("test_electricity_bill.png", b"fake image bytes", "image/png")}
    response = client.post("/api/carbon/upload-bill", files=files, headers=headers)
    assert response.status_code == 200
    assert "analysis" in response.json()
    assert response.json()["analysis"]["utility_type"] == "Electricity"

def test_incident_input_validation():
    headers = get_auth_headers()
    # Invalid category
    payload = {
        "location_text": "Test",
        "category": "Invalid Category Name",
        "severity": "Medium"
    }
    response = client.post("/api/incident/report", json=payload, headers=headers)
    assert response.status_code == 400
    assert "invalid category" in response.json()["detail"].lower()

    # Invalid severity
    payload = {
        "location_text": "Test",
        "category": "Plastic Waste",
        "severity": "Extreme"
    }
    response = client.post("/api/incident/report", json=payload, headers=headers)
    assert response.status_code == 400
    assert "invalid severity" in response.json()["detail"].lower()

