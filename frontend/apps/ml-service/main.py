from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="VoteChain ML Service", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Base pattern for congestion forecasting
BASE_PATTERN = np.array([15, 20, 40, 85, 90, 70, 50, 45, 80, 88, 60, 30])

def get_booth_forecast(booth_id: str) -> np.ndarray:
    """Generate booth-specific forecast by applying multiplier based on booth number"""
    try:
        booth_num = int(booth_id.split('_')[1])
        multiplier = 1 + (booth_num * 0.05)
        return (BASE_PATTERN * multiplier).astype(int).tolist()
    except (ValueError, IndexError):
        return BASE_PATTERN.tolist()

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ml-service"}

@app.get("/predict/peak-hours/{booth_id}")
def predict_peak_hours(booth_id: str):
    """Predict peak and quiet hours for a booth"""
    try:
        forecast = get_booth_forecast(booth_id)
        forecast_arr = np.array(forecast)
        
        peak_hours = forecast_arr[forecast_arr > 70].tolist()
        quiet_hours = forecast_arr[forecast_arr < 30].tolist()
        
        # Find recommended slot (lowest congestion in afternoon)
        afternoon_slice = forecast[9:12]
        min_idx = afternoon_slice.index(min(afternoon_slice))
        recommended_hour = 15 + min_idx
        recommended_slot = f"{recommended_hour}:00 - {recommended_hour + 1}:00"
        
        return {
            "booth_id": booth_id,
            "peak_hours": peak_hours,
            "quiet_hours": quiet_hours,
            "recommended_slot": recommended_slot,
            "congestion_forecast": forecast
        }
    except Exception as e:
        return {
            "error": str(e),
            "booth_id": booth_id,
            "peak_hours": BASE_PATTERN[BASE_PATTERN > 70].tolist(),
            "quiet_hours": BASE_PATTERN[BASE_PATTERN < 30].tolist(),
            "recommended_slot": "14:00 - 15:00",
            "congestion_forecast": BASE_PATTERN.tolist()
        }

@app.get("/booths/all-status")
def get_all_booths_status():
    """Get status of all booths"""
    try:
        booths = {}
        for i in range(1, 7):
            booth_id = f"BOOTH_{i:03d}"
            forecast = get_booth_forecast(booth_id)
            booths[booth_id] = {
                "booth_id": booth_id,
                "congestion_forecast": forecast,
                "current_load": forecast[0] if forecast else 0,
                "status": "active"
            }
        return {"booths": booths}
    except Exception as e:
        return {"error": str(e), "booths": {}}
