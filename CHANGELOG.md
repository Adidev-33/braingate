# Changelog

All notable changes to the BrainGate project will be documented in this file.

## [Unreleased]

### Added - Stretch Goal Sub-phase B: Backend API Extension
- Updated `backend/app/schemas.py`: Added `ToxPredictResponse`, `SolubilityPredictResponse`, `ScorecardResponse`, and enhanced `ExampleMolecule` with optional `known_toxicity`, `known_solubility`, and `known_solubility_tier`.
- Updated `backend/app/main.py`:
  - Added `POST /predict/toxicity`: Returns Tox21 toxicity prediction, probability, 7 SHAP attributions, and plain-language explanation.
  - Added `POST /predict/solubility`: Returns ESOL logS, qualitative solubility tier, 7 SHAP attributions, and plain-language explanation.
  - Added `POST /predict/scorecard`: Multi-property screener computing BBB, toxicity, and solubility in a single call with unified executive summary verdict.
  - Enriched `GET /examples` with benchmark experimental labels.
  - Updated `GET /health` to verify all 3 model engines are loaded and healthy.
- Updated `backend/scripts/test_api.py`: Automated test suite for all 8 endpoints (HTTP 200 / 422 contract verification).

- Created `backend/scripts/data_prep_stretch.py`: Downloaded, cleaned, and featurized MoleculeNet Tox21 (7,823 molecules) and ESOL/Delaney (1,117 molecules) using the standardized 7 RDKit descriptors.
- Established composite toxicity risk flag for Tox21 (36.7% toxic vs 63.3% non-toxic across 12 stress/receptor assays, `scale_pos_weight = 1.7264`).
- Created `backend/scripts/train_stretch_models.py`:
  - Trained Tox21 XGBoost classifier (**0.7411 ROC-AUC**, 0.6810 Balanced Accuracy, 0.6026 F1). Saved to `backend/models/xgb_tox21_model.pkl`.
  - Trained ESOL XGBoost regressor (**R² = 0.8505**, **RMSE = 0.3693** log mol/L, MAE = 0.2709 log mol/L). Saved to `backend/models/xgb_esol_model.pkl`.
  - Saved test evaluation metrics to `backend/models/stretch_metrics.json`.
- Created `backend/app/model_stretch.py`: Singleton managers `Tox21Model` and `ESOLModel` with prediction inference methods and qualitative solubility tiering (High > -2.0, Moderate -4.0 to -2.0, Low < -4.0).
- Created `backend/app/explain_stretch.py`: Added `Tox21Explainer` and `ESOLExplainer` SHAP TreeExplainers with chemist-friendly natural language translations and 1-sentence summaries.
- Created `backend/scripts/test_stretch_models.py`: Verified multi-property inference and SHAP explainability on Caffeine, Dopamine, and Diazepam.
- Confirmed 100% non-regression of the existing BBB pipeline via `backend/scripts/test_api.py`.

### Added - Phase 1: Data & Model Pipeline
- Created `backend/scripts/data_prep.py`: Downloaded, validated, and deduplicated MoleculeNet BBBP dataset into `backend/data/processed/bbbp_cleaned.csv` (1,975 valid molecules).
- Created `backend/app/features.py`: Computes 7 RDKit molecular descriptors (MW, LogP, TPSA, Donors, Acceptors, Rotatable Bonds, Aromatic Rings).
- Created `backend/scripts/train_model.py`: Trained XGBoost binary classifier with `scale_pos_weight` imbalance handling. Achieved **0.8891 ROC-AUC**, 0.9051 Precision, 0.8611 F1-Score on test set. Saved model artifact to `backend/models/xgb_bbbp_model.pkl`.
- Created `backend/app/model.py`: Singleton model manager for loading and evaluating model predictions.
- Created `backend/app/explain.py`: SHAP `TreeExplainer` integration and domain-accurate plain-language natural language translation mapper.
- Created `backend/scripts/validate_rules.py`: Scientific validation script confirming TPSA as the #1 global SHAP feature (0.9529 mean |SHAP|), validating alignment with CNS MPO guidelines.

### Added - Phase 2: Backend API (FastAPI)
- Created `backend/app/schemas.py`: Pydantic request/response schemas for `/predict`, `/examples`, `/compare`, `/health`, and error responses.
- Updated `backend/app/main.py`: Full FastAPI REST API implementation supporting `/health`, `/examples`, `/predict`, `/compare`, with CORS middleware enabled for local Next.js frontend calls (`http://localhost:3000`).
- Installed `httpx` and updated `backend/requirements.txt`.
- Created `backend/scripts/test_api.py`: Automated FastAPI endpoint test suite verifying HTTP statuses and JSON payload contracts across all 4 endpoints.

### Added - Phase 3: Frontend UI (Next.js & Stitch)
- Converted static Google Stitch visual design export (`stitch_braingate_bbb_predictor/`) into Next.js React components.
- Built `frontend/components/Header.tsx`: Top navigation header with status indicators and user lab profile.
- Built `frontend/components/SmilesInput.tsx`: SMILES terminal input card with copy/clear buttons, character counter, RDKit validation badge, and parameter preview bar.
- Built `frontend/components/ExampleMoleculePicker.tsx`: 2x2 grid of reference control benchmark cards (Caffeine, Diazepam, Atenolol, Dopamine) fetched live from `/examples`.
- Built `frontend/components/PredictionCard.tsx`: Endothelial transport filter card rendering prediction label (`Crosses BBB` / `Does Not Cross BBB`), circular SVG confidence gauge, and Executive Chemical Rationale text block.
- Built `frontend/components/ShapBarChart.tsx`: Rebuilt live with Recharts displaying horizontal bars centered around baseline 0 (`+ Favors Crossing` in cyan/emerald, `- Restricts Crossing` in red/rose) and plain-language chemist explanations.
- Built `frontend/components/FeaturesTable.tsx`: Table comparing 7 computed descriptors against CNS MPO guidelines (`TPSA < 90 Å²`, `MW < 450 Da`, `LogP 1–4`).
- Built `frontend/components/InvalidSmilesBanner.tsx`: Red syntax error banner for malformed SMILES strings (`INFERENCE BLOCKED • SYNTAX MALFORMED`).
- Built `frontend/components/ComparisonView.tsx`: Side-by-side comparative analysis mode calling `/compare`.
- Created `.gitignore` ignoring virtualenv, build output, and raw downloads while tracking model and cleaned dataset artifacts.
- Verified end-to-end loop live at `http://localhost:3000`.
