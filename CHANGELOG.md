# Changelog

All notable changes to the BrainGate project will be documented in this file.

## [Unreleased]

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
