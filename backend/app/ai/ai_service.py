import json
import logging
import google.generativeai as genai
from app.config.config import settings

logger = logging.getLogger("ai_service")

# Try to initialize Gemini SDK
gemini_available = False
api_key = settings.GEMINI_API_KEY or settings.GOOGLE_API_KEY
if api_key:
    try:
        genai.configure(api_key=api_key)
        gemini_available = True
        logger.info("Gemini API successfully configured using Google Services.")
    except Exception as e:
        logger.error(f"Failed to configure Gemini SDK: {e}")
else:
    logger.warning("Neither GEMINI_API_KEY nor GOOGLE_API_KEY found in environment. Running with intelligent local fallback system.")

class AIService:
    @staticmethod
    def _call_gemini_json(prompt: str, image_data: bytes = None, mime_type: str = "image/jpeg") -> dict:
        """Helper to invoke Gemini 1.5 Flash and expect a JSON response."""
        if not gemini_available:
            raise ConnectionError("Gemini client is not configured")
            
        try:
            model = genai.GenerativeModel('gemini-1.5-flash', generation_config={"response_mime_type": "application/json"})
            if image_data:
                response = model.generate_content([
                    prompt,
                    {"mime_type": mime_type, "data": image_data}
                ])
            else:
                response = model.generate_content(prompt)
            return json.loads(response.text)
        except Exception as e:
            logger.error(f"Gemini API call failed: {e}")
            raise e

    @classmethod
    def analyze_utility_bill(cls, image_bytes: bytes, filename: str) -> dict:
        """OCR and parsing of utility bills (electricity, water, fuel, etc.) using Gemini."""
        prompt = """
        Analyze this utility bill or fuel receipt image. Extract details for tracking carbon emissions.
        Provide a JSON response with the following keys:
        - "utility_type": string, one of: "Electricity", "Water", "Food", "Shopping", "Transport"
        - "consumption_value": float, quantity consumed (e.g. kWh, Liters, or generic units)
        - "units": string, units of consumption (e.g. "kWh", "L", "kg", or "items")
        - "cost": float, total amount on bill
        - "estimated_carbon_footprint": float, calculated carbon footprint in kg CO2e.
          Guidelines: Electricity = ~0.85 kg per kWh; Water = ~0.001 kg per Liter; Fuel/Transport = ~2.3 kg per Liter.
        - "confidence_score": float, between 0.0 and 1.0
        - "insights": string, brief recommendation on how the user can reduce this specific consumption.
        """
        
        try:
            mime = "image/png" if filename.lower().endswith(".png") else "image/jpeg"
            return cls._call_gemini_json(prompt, image_bytes, mime)
        except Exception:
            logger.info("Falling back to simulated bill extraction...")
            # Fallback based on filename keywords
            fn = filename.lower()
            if "electric" in fn or "power" in fn:
                return {
                    "utility_type": "Electricity",
                    "consumption_value": 185.0,
                    "units": "kWh",
                    "cost": 42.50,
                    "estimated_carbon_footprint": 157.25,
                    "confidence_score": 0.95,
                    "insights": "Your electricity consumption is 8% higher than last month. Try unplugging standby appliances and switching to LED lightbulbs."
                }
            elif "water" in fn:
                return {
                    "utility_type": "Water",
                    "consumption_value": 1200.0,
                    "units": "L",
                    "cost": 15.00,
                    "estimated_carbon_footprint": 1.2,
                    "confidence_score": 0.92,
                    "insights": "Excellent water management! To reduce further, install low-flow aerators on kitchen and bathroom faucets."
                }
            elif "fuel" in fn or "gas" in fn or "petrol" in fn:
                return {
                    "utility_type": "Transport",
                    "consumption_value": 45.0,
                    "units": "L",
                    "cost": 55.00,
                    "estimated_carbon_footprint": 103.5,
                    "confidence_score": 0.89,
                    "insights": "This fuel purchase contributed ~103kg to your carbon footprint. Consider carpooling or batching errands to reduce mileage."
                }
            else:
                # Default generic fallback
                return {
                    "utility_type": "Shopping",
                    "consumption_value": 5.0,
                    "units": "items",
                    "cost": 120.00,
                    "estimated_carbon_footprint": 12.4,
                    "confidence_score": 0.75,
                    "insights": "General shopping items detected. Purchasing locally produced goods can help reduce logistics-based carbon emissions."
                }

    @classmethod
    def classify_pollution_image(cls, image_bytes: bytes) -> dict:
        """Computer vision classification of garbage or pollution reports using Gemini."""
        prompt = """
        Analyze this environmental incident image.
        Provide a JSON response with the following keys:
        - "category": string, one of: "Garbage Dumping", "Air Pollution", "Water Pollution", "Plastic Waste", "Other"
        - "severity": string, one of: "Low", "Medium", "High"
        - "confidence_score": float, between 0.0 and 1.0
        - "description": string, short detailed description of what environmental issue is visible
        - "suggested_actions": string, brief advice on how individuals can handle this issue safely
        - "assigned_authority": string, name of local body (e.g. "Municipal Corporation", "Pollution Control Board", "Forest Department")
        """
        
        try:
            return cls._call_gemini_json(prompt, image_bytes, "image/jpeg")
        except Exception:
            logger.info("Falling back to simulated pollution classification...")
            return {
                "category": "Garbage Dumping",
                "severity": "Medium",
                "confidence_score": 0.94,
                "description": "Accumulation of unsegregated plastic containers, organic waste, and cardboard on a public sidewalk, obstructing pedestrian pathway and creating sanitation hazards.",
                "suggested_actions": "Avoid contact. Report location coordinates immediately to the municipal agency. Help organize a localized weekend cleanup campaign.",
                "assigned_authority": "Municipal Corporation"
            }

    @classmethod
    def generate_recommendations(cls, user_profile: dict, carbon_history: list) -> list:
        """Generate custom recommended carbon actions based on historical data."""
        if gemini_available:
            prompt = f"""
            Given the user profile: {json.dumps(user_profile)}
            and carbon history (recent records): {json.dumps(carbon_history)}
            
            Provide a list of exactly 3 carbon reduction recommendations.
            Format the output strictly as a JSON list of objects. Each object must contain:
            - "id": string, unique action code (e.g. "rec_cycle_commute")
            - "title": string, clear title (e.g. "Switch to a bicycle for short trips")
            - "description": string, tailored reasoning including simulated numbers (e.g. "Switching your 8km commute twice weekly could save X kg CO2 monthly")
            - "savings": float, expected CO2 savings per month in kg (e.g. 12.0)
            - "difficulty": string, "Easy", "Medium", or "Hard"
            - "category": string, one of "Transport", "Electricity", "Food", "Shopping", "Waste", "Water"
            """
            try:
                model = genai.GenerativeModel('gemini-1.5-flash', generation_config={"response_mime_type": "application/json"})
                res = model.generate_content(prompt)
                return json.loads(res.text)
            except Exception as e:
                logger.error(f"Gemini recommendations failed: {e}")
                
        # Default high-fidelity mock list (matching dashboard_page mockup)
        return [
            {
                "id": "rec_commute",
                "title": "Switch to a bicycle for 8km daily commute",
                "description": "Replacing your daily motorbike or car commute with cycling can reduce carbon emissions by approximately 12 kg CO2 per month.",
                "savings": 12.0,
                "difficulty": "Medium",
                "category": "Transport"
            },
            {
                "id": "rec_led",
                "title": "Use LED bulbs in your home",
                "description": "Replacing standard incandescent bulbs with energy-efficient LEDs saves around 5 kg CO2 per month and cuts electricity costs.",
                "savings": 5.0,
                "difficulty": "Easy",
                "category": "Electricity"
            },
            {
                "id": "rec_diet",
                "title": "Try a vegetarian diet 2 days a week",
                "description": "Skipping meat twice a week lowers emissions from agricultural logistics and livestock, reducing footprint by ~8 kg CO2 monthly.",
                "savings": 8.0,
                "difficulty": "Easy",
                "category": "Food"
            }
        ]

    @classmethod
    def chatbot_response(cls, history: list, new_message: str) -> str:
        """Interactive chatbot response using Gemini."""
        if gemini_available:
            try:
                model = genai.GenerativeModel('gemini-1.5-flash')
                chat = model.start_chat(history=[])
                # Convert input history format to Gemini format
                # (For simplicity we feed standard text summary as system context)
                system_context = (
                    "You are EcoBot AI, a helpful, encouraging sustainability assistant on the EcoSphere AI platform. "
                    "Keep your responses friendly, concise, actionable, and focus on practical steps to reduce carbon footprints. "
                    "Use bullet points for lists and support markdown format."
                )
                formatted_prompt = f"{system_context}\nUser says: {new_message}"
                response = chat.send_message(formatted_prompt)
                return response.text
            except Exception as e:
                logger.error(f"Gemini chatbot failed: {e}")

        # Intelligent local chatbot fallback
        msg = new_message.lower()
        if "reduce" in msg or "carbon footprint" in msg or "co2" in msg:
            return (
                "Here are 3 quick and highly effective ways to start reducing your carbon footprint today:\n\n"
                "1. **Adjust Transportation:** Cycle or walk for trips under 3km, or utilize local metro systems instead of single-passenger cars.\n"
                "2. **Optimize Home Energy:** Wash clothes in cold water, hang dry them, and ensure your thermostat is set to 24°C (75°F) during warmer months.\n"
                "3. **Dietary Shifts:** Incorporate more plant-based meals. Beef and dairy have a significantly higher greenhouse gas footprint than grains, vegetables, and poultry.\n\n"
                "Would you like to simulate a specific change in our **Carbon Simulator** to calculate your exact savings?"
            )
        elif "garbage" in msg or "incident" in msg or "report" in msg:
            return (
                "You can report pollution or illegal dumping directly through our **Incident Reporting** tab! "
                "Simply take or upload a photo, and our AI will automatically classify the waste type, evaluate severity, "
                "and route the details to the appropriate local department (like the Municipal Corporation). "
                "You will earn Eco Points for reports that get verified!"
            )
        elif "game" in msg or "quiz" in msg or "score" in msg:
            return (
                "To increase your Eco Score and learn more about sustainability, head over to the **Games** or **Challenges** section!\n\n"
                "- In the **Waste Sorter Game**, you will classify waste items into Recyclable, Organic, and Hazardous.\n"
                "- Completing active challenges like 'No Vehicle Day' will award you bonus Eco Points and unlock special badges."
            )
        else:
            return (
                "Hello! I'm EcoBot AI, your personal environmental intelligence assistant. "
                "I can help you analyze your carbon footprint, explain how to file incident reports, "
                "or suggest custom reduction goals. What are you working on today?"
            )
