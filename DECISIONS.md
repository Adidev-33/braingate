# Project Decisions

## Decision Log

### 2026-09-04 — Decoupled 2-Service Architecture (FastAPI + Next.js)

**Decision:**
Use FastAPI (Python 3.10+) for the backend service handling RDKit molecular descriptor calculations, XGBoost inference, and SHAP explainability. Use Next.js (React/TypeScript) for the frontend UI.

**Reason:**
RDKit, XGBoost, and SHAP require C extensions and Python ecosystem libraries with no native JavaScript equivalents. Micro-service decoupling allows clean interface boundaries and easy deployment.

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
