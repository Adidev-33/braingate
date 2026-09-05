# TODO — BrainGate Task Backlog

## High Priority

### Phase 1 — Data & Model Pipeline [100% COMPLETE]
- [x] Download BBBP dataset and perform SMILES validation using RDKit (`backend/scripts/data_prep.py`).
- [x] Deduplicate SMILES and export `backend/data/processed/bbbp_cleaned.csv`.
- [x] Implement `features.py` to extract 7 RDKit descriptors (MW, LogP, TPSA, Donors, Acceptors, Rotatable Bonds, Aromatic Rings).
- [x] Write `train_model.py` to train XGBoost classifier with scaffold/stratified split and `scale_pos_weight`.
- [x] Save trained model artifact to `backend/models/xgb_bbbp_model.pkl`.
- [x] Build `explain.py` with `shap.TreeExplainer` and plain-language natural language template mapper.
- [x] Validate SHAP feature rankings against CNS MPO guidelines (`backend/scripts/validate_rules.py`).

### Phase 2 — Backend API (FastAPI) [100% COMPLETE]
- [x] Implement `app/schemas.py` with Pydantic request/response models per Section 8.3 spec contract.
- [x] Build `app/main.py` with `/health`, `/examples`, `/predict`, and `/compare` endpoints.
- [x] Perform HTTP / `curl` verification of API endpoints (`test_api.py`).

### Phase 3 — Frontend (Next.js & Stitch) [100% COMPLETE]
- [x] Scaffold Next.js TypeScript + Tailwind CSS app in `frontend/`.
- [x] Convert static Stitch visual design export (`stitch_braingate_bbb_predictor/`) into React components.
- [x] Build `Header`, `SmilesInput`, `ExampleMoleculePicker`, `PredictionCard`, `ShapBarChart` (Recharts), `FeaturesTable`, `InvalidSmilesBanner`, `ComparisonView`.
- [x] Wire to live FastAPI backend (`http://localhost:8000`) and verify end-to-end loop at `http://localhost:3000`.

### Phase 4 — Polish & Pitch Materials [100% COMPLETE]
- [x] UI polish and responsive testing across desktop and mobile breakpoints.
- [x] Verify and capture screenshots of all three UI states:
  - Success / Permeable prediction (e.g. Caffeine)
  - Failure / Non-permeable prediction (e.g. Atenolol / Dopamine) — visually distinct with red/rose error theme
  - Invalid SMILES error banner (e.g. `INVALID_SMILES_STRING_123`) — driven by HTTP 422 API response
- [x] Test `/compare` comparison mode end-to-end in browser with Caffeine vs. Dopamine.
- [x] Prepare written pitch materials bridging faster BBB screening to earlier patient treatment access.
- [x] Prepare positioning vs. prior art (SwissADME, pkCSM).
- [x] Prepare 2–3 backup example molecules with pre-verified predictions.

## Stretch Goal — Multi-Property Screener [100% COMPLETE]
- [x] **Sub-phase A — Data & Models:**
  - [x] Download & clean Tox21 and ESOL datasets via DeepChem MoleculeNet (`backend/scripts/data_prep_stretch.py`).
  - [x] Featurize both datasets using standardized 7 RDKit descriptors (`FEATURE_NAMES`).
  - [x] Implement composite toxicity risk flag for Tox21 (36.7% toxic, `scale_pos_weight = 1.7264`).
  - [x] Train Tox21 XGBoost classifier (ROC-AUC: 0.7411) -> `backend/models/xgb_tox21_model.pkl`.
  - [x] Train ESOL XGBoost regressor (R²: 0.8505, RMSE: 0.3693) -> `backend/models/xgb_esol_model.pkl`.
  - [x] Implement `Tox21Model` & `ESOLModel` singletons (`backend/app/model_stretch.py`).
  - [x] Implement `Tox21Explainer` & `ESOLExplainer` SHAP TreeExplainers + plain-language rationale (`backend/app/explain_stretch.py`).
  - [x] Verify offline pipeline (`backend/scripts/test_stretch_models.py`) and non-regression of core BBB API (`backend/scripts/test_api.py`).
- [x] **Sub-phase B — Backend API Extension:**
  - [x] Add `POST /predict/toxicity` and `POST /predict/solubility` matching `/predict` shape.
  - [x] Add combined `POST /predict/scorecard` with all 3 properties and synthesized executive verdict.
  - [x] Update `/examples` to include known toxicity and solubility annotations.
  - [x] Verify endpoints with automated test calls (`backend/scripts/test_api.py`).
- [x] **Sub-phase C — Frontend Tabs:**
  - [x] Add tabs: "BBB Permeability" (default), "Toxicity", "Solubility", "Full Scorecard".
  - [x] Wire single-property tabs to `/predict/toxicity` and `/predict/solubility`.
  - [x] Wire "Full Scorecard" tab to `/predict/scorecard`.
  - [x] Preserve core BBB and comparison mode functionality.

## PDF Report Generation [100% COMPLETE]
- [x] Implemented `backend/app/pdf_generator.py` with ReportLab and Matplotlib for static SHAP charts, CNS MPO comparison table, multi-property scorecard, and headers/footers.
- [x] Added `POST /report/pdf` in FastAPI with dynamic computation and scorecard passthrough.
- [x] Added "PDF Report" and "Generate PDF Report" buttons on `PredictionCard` and `ScorecardView`.
- [x] Added browser blob download trigger with inline error notifications in Next.js frontend.
- [x] Automated test script and visual PNG snapshot verification (`backend/scripts/test_pdf_report.py`).
