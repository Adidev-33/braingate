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

### Phase 2 — Backend API (FastAPI) [NEXT]
- [ ] Implement `app/schemas.py` with Pydantic request/response models per Section 8.3 spec contract.
- [ ] Build `app/main.py` with `/health`, `/examples`, `/predict`, and `/compare` endpoints.
- [ ] Perform HTTP / `curl` verification of API endpoints.

## Medium Priority

### Phase 3 — Frontend (Next.js)
- [ ] Initialize Next.js app in `frontend/`.
- [ ] Apply Stitch UI/visual design for SMILES form and prediction results.
- [ ] Build `PredictionCard` and `ShapBarChart` components.

## Low Priority

### Phase 4 — Polish & Pitch
- [ ] UI polish and responsive testing.
- [ ] Prepare pitch materials linking BBB drug candidate failure to patient treatment access timelines.

## Future Ideas
- [ ] Stretch goal: Tox21 and ESOL multi-property scorecard endpoints.
