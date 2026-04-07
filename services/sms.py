import requests

API_KEY = "UFfyZit1Lq9xgqOLydRSO3M2KzsppOUsDSmwcQbMamZF96osPTyvvIi5FzSd"  

# Add all team numbers without +91
TEAM_NUMBERS = "9152045401"  # comma separated, no spaces

def send_crisis_alert(zone, service, score):
    message = f"CityShield Alert! {zone} zone - {service} risk is HIGH (Score: {score}/10). Take precautions immediately."
    
    url = "https://www.fast2sms.com/dev/bulkV2"
    payload = {
        "route": "q",
        "message": message,
        "language": "english",
        "flash": 0,
        "numbers": TEAM_NUMBERS
    }
    headers = {
        "authorization": API_KEY
    }
    
    response = requests.post(url, json=payload, headers=headers)
    result = response.json()
    
    if result.get("return") == True:
        print(f"✅ SMS sent successfully to all numbers!")
        print(f"Message: {message}")
    else:
        print(f"❌ Failed: {result}")
    
    return result

# Test it
send_crisis_alert("Kothrud", "Fuel", 8)