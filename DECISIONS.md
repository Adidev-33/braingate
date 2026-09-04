# Project Decisions

## Decision Log

### 2026-09-04 — Decoupled 2-Service Architecture (Switch from Streamlit to Next.js + FastAPI)

**Decision:**
Switch from the originally planned single-service Streamlit application to a decoupled 2-service architecture: FastAPI (Python 3.10+) backend service + Next.js (TypeScript + Tailwind CSS) frontend UI.

**Reason:**
Streamlit provided limited layout customizability, animation capabilities, and presentation flexibility for hackathon judging. Decoupling into Next.js + FastAPI allows a state-of-the-art UI with high visual aesthetics while preserving the full C++ / Python RDKit, XGBoost, and SHAP computational pipeline.

**Alternatives Considered:**
- Pure Streamlit / Gradio application: Low visual fidelity and non-standard web layout.
- Next.js API routes calling Python subprocesses: High request latency and fragile C-extension environment bindings.

---

### 2026-09-04 — Stitch UI Workflow: Hand-Crafting on Web UI & Manual HTML/PNG Export Conversion

**Decision:**
After encountering an authentication failure with the Google Stitch MCP connector in the automated tool environment, pivot to hand-crafting the UI screens directly on the Google Stitch web interface and exporting the static HTML/PNG artifacts (`stitch_braingate_bbb_predictor/`) as the visual source of truth.

**Reason:**
Preserves the high visual aesthetics designed in Google Stitch while overcoming MCP authentication friction. The static HTML/PNG export served as the exact specification for building modular Next.js React components (`Header`, `SmilesInput`, `PredictionCard`, `ShapBarChart`, `FeaturesTable`) wired to real backend endpoints.

---

### 2026-09-04 — Feature Set Selection & Interpretability Trade-off

**Decision:**
Use 7 interpretable RDKit molecular descriptors (MW, LogP, TPSA, Donors, Acceptors, Rotatable Bonds, Aromatic Rings) rather than high-dimensional Morgan/ECFP fingerprints or deep molecular graph embeddings.

**Reason:**
High-dimensional molecular fingerprints (e.g. 2048-bit ECFP4) act as black-box sub-structure vectors where individual bits are difficult to explain to medicinal chemists. The 7 physical descriptors directly map to human-understandable pharmacokinetic properties (CNS MPO guidelines) and allow plain-language SHAP explanations.

---

### 2026-09-04 — Model Architecture & Imbalance Strategy

**Decision:**
Use XGBoost classifier with `scale_pos_weight` set to ratio of negative to positive training samples (0.3071) and early stopping on a stratified validation set.

**Reason:**
BBBP dataset is imbalanced (76.5% permeable vs 23.5% non-permeable). Tree-based gradient boosting allows exact SHAP TreeExplainer calculation and high ROC-AUC performance (0.8891 achieved).
