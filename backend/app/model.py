import os
import sys
import joblib
import pandas as pd

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.app.features import FEATURE_NAMES

MODEL_PATH = os.path.join(PROJECT_ROOT, "backend", "models", "xgb_bbbp_model.pkl")


class BBBModel:
    """Singleton model manager for loading and running predictions on XGBoost model."""

    _instance = None
    _model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(BBBModel, cls).__new__(cls)
            cls._instance._load_model()
        return cls._instance

    def _load_model(self):
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Trained model file not found at {MODEL_PATH}. Run train_model.py first.")
        print(f"Loading trained XGBoost model from {MODEL_PATH}...")
        self._model = joblib.load(MODEL_PATH)

    def get_raw_model(self):
        """Returns underlying XGBoost classifier instance for SHAP Explainer."""
        return self._model

    def predict(self, feature_dict: dict) -> dict:
        """
        Runs model prediction on a feature dictionary.
        Returns prediction label ('permeable' | 'non_permeable') and confidence score.
        """
        df_input = pd.DataFrame([feature_dict])[FEATURE_NAMES]
        prob = float(self._model.predict_proba(df_input)[0, 1])

        prediction_label = "permeable" if prob >= 0.5 else "non_permeable"
        confidence = prob if prediction_label == "permeable" else (1.0 - prob)

        return {
            "prediction": prediction_label,
            "confidence": round(confidence, 4),
            "permeable_probability": round(prob, 4)
        }
