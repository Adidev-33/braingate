import os
import sys
import joblib
import pandas as pd

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.app.features import FEATURE_NAMES

TOX21_MODEL_PATH = os.path.join(PROJECT_ROOT, "backend", "models", "xgb_tox21_model.pkl")
ESOL_MODEL_PATH = os.path.join(PROJECT_ROOT, "backend", "models", "xgb_esol_model.pkl")


class Tox21Model:
    """Singleton model manager for loading and running predictions on Tox21 XGBoost model."""

    _instance = None
    _model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Tox21Model, cls).__new__(cls)
            cls._instance._load_model()
        return cls._instance

    def _load_model(self):
        if not os.path.exists(TOX21_MODEL_PATH):
            raise FileNotFoundError(f"Trained Tox21 model file not found at {TOX21_MODEL_PATH}.")
        print(f"Loading trained Tox21 model from {TOX21_MODEL_PATH}...")
        self._model = joblib.load(TOX21_MODEL_PATH)

    def get_raw_model(self):
        """Returns underlying XGBoost classifier instance for SHAP Explainer."""
        return self._model

    def predict(self, feature_dict: dict) -> dict:
        """
        Runs model prediction on a feature dictionary.
        Returns prediction label ('toxic' | 'non_toxic'), confidence, and probability.
        """
        df_input = pd.DataFrame([feature_dict])[FEATURE_NAMES]
        prob = float(self._model.predict_proba(df_input)[0, 1])

        prediction_label = "toxic" if prob >= 0.5 else "non_toxic"
        confidence = prob if prediction_label == "toxic" else (1.0 - prob)

        return {
            "prediction": prediction_label,
            "confidence": round(confidence, 4),
            "toxic_probability": round(prob, 4)
        }


class ESOLModel:
    """Singleton model manager for loading and running predictions on ESOL solubility XGBoost regressor."""

    _instance = None
    _model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ESOLModel, cls).__new__(cls)
            cls._instance._load_model()
        return cls._instance

    def _load_model(self):
        if not os.path.exists(ESOL_MODEL_PATH):
            raise FileNotFoundError(f"Trained ESOL model file not found at {ESOL_MODEL_PATH}.")
        print(f"Loading trained ESOL model from {ESOL_MODEL_PATH}...")
        self._model = joblib.load(ESOL_MODEL_PATH)

    def get_raw_model(self):
        """Returns underlying XGBoost regressor instance for SHAP Explainer."""
        return self._model

    def predict(self, feature_dict: dict) -> dict:
        """
        Runs model prediction on a feature dictionary.
        Returns predicted log solubility and qualitative solubility tier.
        """
        df_input = pd.DataFrame([feature_dict])[FEATURE_NAMES]
        log_s = float(self._model.predict(df_input)[0])

        # Qualitative solubility classification standard in medicinal chemistry:
        # High: > -2.0 log(mol/L)
        # Moderate: -4.0 to -2.0 log(mol/L)
        # Low / Poor: < -4.0 log(mol/L)
        if log_s > -2.0:
            tier = "High"
            tier_desc = "Highly soluble in aqueous media (> 10 mM)"
        elif log_s >= -4.0:
            tier = "Moderate"
            tier_desc = "Moderately soluble (0.1 - 10 mM), typical drug-like range"
        else:
            tier = "Low"
            tier_desc = "Poorly soluble (< 0.1 mM), formulation liability"

        return {
            "log_solubility": round(log_s, 4),
            "solubility_tier": tier,
            "tier_description": tier_desc,
            "unit": "log(mol/L)"
        }
