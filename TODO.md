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

## Future Ideas / Stretch Goal
- [ ] Tox21 and ESOL multi-property scorecard endpoints + frontend tabs (only after Phase 4 is 100% complete).
