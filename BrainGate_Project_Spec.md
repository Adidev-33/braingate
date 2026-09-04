# BrainGate — Explainable Blood-Brain Barrier Permeability Predictor
## Complete Project Specification

---

## 1. Project Overview

**Name:** BrainGate

**One-line description:** An explainable machine learning tool that predicts whether a candidate drug molecule can cross the blood-brain barrier (BBB), showing its reasoning in plain, chemist-readable language rather than a black-box score.

**Category:** Health-tech / Computational drug discovery / Explainable AI

**Core value proposition:** Existing BBB prediction tools (SwissADME, pkCSM, admetSAR) give a binary yes/no flag with no explanation. BrainGate adds a real-time, per-molecule, plain-English explanation layer (via SHAP) on top of an accurate classifier — turning a black-box screen into an interpretable decision-support tool that mirrors how a medicinal chemist actually reasons.

---

## 2. Problem Statement (for reference/context)

Roughly 98% of small-molecule drug candidates for neurological conditions (Alzheimer's, depression, epilepsy, brain tumors) fail because they cannot cross the blood-brain barrier — regardless of how biologically effective they are. This is typically discovered only after expensive, slow lab and animal testing. A fast, transparent, low-cost computational screening step — one that also explains *why* a molecule fails — can eliminate weak candidates early, saving time and money and accelerating the path to treatment.

---

## 3. Dataset Details

### 3.1 Primary dataset — BBBP (Blood-Brain Barrier Penetration)

- **Source:** MoleculeNet benchmark collection
- **Size:** ~2,050 molecules (exact count varies slightly by mirror; expect ~2,039–2,050 after cleaning)
- **Format:** CSV with columns typically named:
  - `num` — row index
  - `name` — compound name
  - `smiles` — SMILES string representation of the molecule
  - `p_np` — binary label: `1` = penetrates BBB, `0` = does not penetrate
- **Class balance:** Imbalanced — approximately 76% permeable (1), 24% non-permeable (0). **Must be handled explicitly** (stratified split, class weighting, or SMOTE).
- **Known data quality issues:**
  - A small number of SMILES strings fail to parse in RDKit — must be filtered out (`Chem.MolFromSmiles()` returns `None`).
  - Some duplicate SMILES exist, occasionally with conflicting labels — deduplicate and resolve before training.

### 3.2 How to obtain it

**Option A — DeepChem (recommended, gives pre-split train/valid/test):**
```bash
pip install deepchem
```
```python
import deepchem as dc
tasks, datasets, transformers = dc.molnet.load_bbbp(featurizer='Raw')
train_dataset, valid_dataset, test_dataset = datasets
```

**Option B — Direct CSV:**
Download `BBBP.csv` from the official MoleculeNet dataset mirror or DeepChem's GitHub repository. Confirm columns match section 3.1 before proceeding.

**Option C — Hugging Face Datasets:**
```python
from datasets import load_dataset
ds = load_dataset("scikit-fingerprints/MoleculeNet_BBBP")
```

### 3.3 Stretch-goal datasets (optional, if time allows)

- **Tox21** — toxicity prediction, also from MoleculeNet, multi-task binary classification across 12 toxicity assays.
- **ESOL** — aqueous solubility (regression, log solubility values), also from MoleculeNet.
- Both usable via the same `deepchem.molnet` loader pattern (`dc.molnet.load_tox21()`, `dc.molnet.load_delaney()` for ESOL).

### 3.4 Data validation checklist (do this before any modeling)

1. Load CSV, confirm row count and column names.
2. Run every `smiles` value through `RDKit.Chem.MolFromSmiles()`; drop rows returning `None`; log how many were dropped.
3. Check for duplicate SMILES; deduplicate, keeping majority-vote label if conflicts exist.
4. Print class balance (`value_counts()` on the label column).
5. Save a cleaned CSV (e.g., `bbbp_cleaned.csv`) as the single source of truth for the rest of the pipeline.

---

## 4. Feature Engineering

Compute the following **RDKit molecular descriptors** for every valid SMILES (these are the model's input features — not fingerprints, so they stay human-interpretable):

| Feature | RDKit function | Why it matters |
|---|---|---|
| Molecular Weight (MW) | `Descriptors.MolWt` | Heavier molecules struggle to cross membranes |
| LogP | `Descriptors.MolLogP` (Crippen) | Fat vs. water solubility — BBB favors moderately lipophilic molecules |
| Topological Polar Surface Area (TPSA) | `Descriptors.TPSA` | **Single strongest known predictor** of BBB penetration; lower TPSA = better crossing |
| H-Bond Donors | `Descriptors.NumHDonors` | More donors = harder to cross lipid membrane |
| H-Bond Acceptors | `Descriptors.NumHAcceptors` | Same logic as donors |
| Rotatable Bonds | `Descriptors.NumRotatableBonds` | Molecular flexibility affects membrane permeability |
| Aromatic Ring Count | `Descriptors.NumAromaticRings` (or `Chem.Lipinski.NumAromaticRings`) | Correlates with lipophilicity and rigidity |

**Reference thresholds to validate against later (CNS MPO guidelines):**
- TPSA < 90 Ų
- Molecular Weight < 450 Da
- LogP between 1 and 4

Store these as a features table (`features_df`) aligned by row with the cleaned dataset, ready to feed into the model.

---

## 5. Model

- **Algorithm:** Gradient-boosted trees — **XGBoost** (primary choice) or Random Forest (fallback/comparison baseline)
- **Task:** Binary classification (permeable vs. not)
- **Train/validation/test split:** Use DeepChem's scaffold split if using Option A above (more realistic than random split for molecular data); otherwise stratified random split (e.g., 80/10/10) preserving class balance
- **Class imbalance handling:** Use `scale_pos_weight` in XGBoost, or SMOTE on the training set only (never on validation/test)
- **Hyperparameters to start with (XGBoost):**
  - `n_estimators`: 200–500
  - `max_depth`: 4–6
  - `learning_rate`: 0.05–0.1
  - `scale_pos_weight`: ratio of negative to positive class in training set
- **Evaluation metrics:** ROC-AUC (primary), balanced accuracy, precision/recall, confusion matrix. Report both cross-validated and held-out test performance.
- **Target benchmark:** Published BBB models on similar descriptor sets typically achieve ROC-AUC in the 0.85–0.93 range — aim for this ballpark as a sanity check that the model is reasonable, not necessarily beating it.

---

## 6. Explainability Layer (SHAP)

- **Library:** `shap` (Python)
- **Explainer type:** `shap.TreeExplainer` (fast, exact for tree-based models like XGBoost)
- **Per-prediction output:** For any single molecule, generate SHAP values for each of the 7 features, showing which pushed the prediction toward "permeable" vs. "non-permeable" and by how much.
- **Plain-language translation layer (custom logic you write):** Map SHAP feature contributions into human-readable sentences, e.g.:
  - High positive TPSA contribution → *"Blocked mainly due to high polarity (TPSA), despite acceptable molecular weight."*
  - Low LogP, high H-bond donors → *"Struggles to cross due to poor fat-solubility and excessive hydrogen bonding."*
  - This requires a small rules/template engine mapping (feature name + SHAP sign + magnitude) → natural language snippet. Build a lookup table of feature→phrase templates.
- **Global explainability (for judges/validation):** A SHAP summary plot (beeswarm or bar) across the full test set, showing overall feature importance ranking.

---

## 7. Scientific Validation Step

Compare the model's SHAP-derived feature importance ranking against the established **CNS MPO (Multiparameter Optimization) guidelines** used by real pharmacologists (TPSA < 90, MW < 450, LogP 1–4). Document whether TPSA emerges as the top or near-top SHAP feature *without being explicitly told the rule* — this is your key "standout" evidence that the model has learned real chemistry, not noise. Present this as a simple comparison table or chart in the demo/pitch.

---

## 8. Demo Application (Next.js frontend + Python API backend)

RDKit, XGBoost, and SHAP are Python-only libraries — there is no usable JS equivalent for cheminformatics descriptor calculation. So this is a **two-service architecture**: a Python API does the ML/chemistry work, and Next.js is purely the UI that calls it. This is the standard, correct way to pair Next.js with a Python ML model — not a workaround.

### 8.1 Architecture

```
┌─────────────────────┐        HTTP/JSON        ┌──────────────────────┐
│   Next.js Frontend   │ ───────────────────────▶│   FastAPI Backend     │
│   (UI, forms, charts)│ ◀─────────────────────── │  (RDKit, XGBoost,     │
│                       │      prediction +        │   SHAP inference)     │
└─────────────────────┘      explanation JSON     └──────────────────────┘
```

- **Frontend (Next.js):** handles the SMILES input form, example-molecule picker, calling the API, rendering the prediction, confidence score, SHAP bar chart, and comparison mode.
- **Backend (FastAPI):** a small Python service that loads the trained XGBoost model once at startup, exposes REST endpoints, computes RDKit descriptors + SHAP values per request, and returns clean JSON.
- They run as two separate local processes during development (Next.js on port 3000, FastAPI on port 8000) and the Next.js app calls the API via `fetch`.

### 8.2 Functional requirements (unchanged from before, now UI-driven)

1. **Input:** A text input for pasting a SMILES string, plus buttons/dropdown for example molecules (caffeine — permeable; a known non-permeable molecule from the dataset).
2. **Output, rendered in the UI:**
   - Prediction label ("Crosses BBB" / "Does Not Cross") with a confidence percentage
   - A bar chart (top 3–4 SHAP features) labeled in plain English, not raw feature names
   - A one-line plain-English summary sentence
3. **Optional (if time allows):** Side-by-side comparison mode — two input forms, two result cards rendered next to each other, with the deciding feature difference called out.

### 8.3 Backend API contract

**`POST /predict`**

Request body:
```json
{ "smiles": "CN1C=NC2=C1C(=O)N(C(=O)N2C)C" }
```

Response body:
```json
{
  "valid_smiles": true,
  "prediction": "permeable",
  "confidence": 0.87,
  "features": {
    "mol_weight": 194.19,
    "logp": -1.03,
    "tpsa": 61.82,
    "h_donors": 0,
    "h_acceptors": 6,
    "rotatable_bonds": 0,
    "aromatic_rings": 1
  },
  "shap_explanation": [
    { "feature": "tpsa", "value": 61.82, "shap_value": 0.21, "plain_text": "Moderate polarity supports crossing the barrier" },
    { "feature": "logp", "value": -1.03, "shap_value": 0.08, "plain_text": "Slightly favors fat-solubility needed to cross" }
  ],
  "summary_sentence": "Predicted to cross the BBB, mainly due to moderate polarity and acceptable molecular weight."
}
```

If the SMILES is invalid, return `{ "valid_smiles": false, "error": "Could not parse SMILES string" }` with an appropriate HTTP status (e.g., 422) so the frontend can show a clear error state.

**`GET /examples`** — returns the small curated list of example molecules (name + SMILES + known label) so the frontend doesn't hardcode them.

**`POST /compare`** (optional, for comparison mode) — accepts two SMILES strings, returns two full prediction objects (same shape as `/predict`) plus a short `deciding_difference` string.

**`GET /health`** — simple liveness check, useful for confirming the backend is up before the frontend calls it.

### 8.4 Tech stack

**Backend (Python):**
- FastAPI — API framework
- Uvicorn — ASGI server
- RDKit — SMILES parsing, descriptor computation
- XGBoost / scikit-learn — trained classifier, loaded via `joblib`/`pickle` at startup
- SHAP — `TreeExplainer`, computed live per request (fast enough for real-time use)
- Pydantic — request/response schema validation (built into FastAPI)

**Frontend (Next.js):**
- Next.js (App Router, latest stable) with TypeScript
- Tailwind CSS for styling
- A charting library for the SHAP bar chart — Recharts or Chart.js both work well with Next.js
- Native `fetch` (or a small wrapper) for calling the FastAPI backend — no need for a heavier data-fetching library at this scale
- Simple React state (`useState`) for form input, loading state, and results — no global state library needed for a tool this size

### 8.5 Suggested project structure

```
braingate/
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI app, route definitions
│   │   ├── features.py           # RDKit descriptor computation
│   │   ├── model.py              # load model, run prediction
│   │   ├── explain.py            # SHAP computation + plain-language mapping
│   │   └── schemas.py            # Pydantic request/response models
│   ├── data/
│   │   ├── raw/                  # original downloaded BBBP.csv
│   │   └── processed/            # cleaned dataset + computed features
│   ├── models/
│   │   └── xgb_bbbp_model.pkl    # trained model artifact
│   ├── scripts/
│   │   ├── data_prep.py          # download, clean, validate SMILES
│   │   ├── train_model.py        # train + evaluate XGBoost model
│   │   └── validate_rules.py     # compare SHAP importance vs CNS MPO rules
│   ├── requirements.txt
│   └── notebooks/
│       └── exploration.ipynb
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx               # main page: input form + results
│   │   ├── compare/page.tsx       # optional comparison mode page
│   │   └── layout.tsx
│   ├── components/
│   │   ├── SmilesInput.tsx
│   │   ├── ExampleMoleculePicker.tsx
│   │   ├── PredictionCard.tsx
│   │   ├── ShapBarChart.tsx
│   │   └── ComparisonView.tsx
│   ├── lib/
│   │   └── api.ts                 # fetch wrapper for calling FastAPI backend
│   ├── package.json
│   ├── tailwind.config.ts
│   └── tsconfig.json
│
└── README.md
```

### 8.6 Dependencies

**backend/requirements.txt**
```
fastapi
uvicorn[standard]
rdkit
xgboost
scikit-learn
shap
pandas
numpy
pydantic
python-multipart
deepchem          # optional, only if using DeepChem loader
imbalanced-learn  # optional, only if using SMOTE
```

**frontend (via npm/pnpm):**
```
next
react
react-dom
typescript
tailwindcss
recharts
```

### 8.7 Local development setup

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev   # runs on port 3000
```

Set `NEXT_PUBLIC_API_URL=http://localhost:8000` in a `frontend/.env.local` file so the Next.js app knows where to send requests. This also makes it trivial to point the frontend at a deployed backend URL later without code changes.

### 8.8 Deployment note (for demo day)

- **Frontend:** deploys cleanly to Vercel (native Next.js support).
- **Backend:** Vercel does not support RDKit/XGBoost well (heavy native dependencies, cold-start issues) — deploy the FastAPI backend separately, e.g., Render, Railway, or Fly.io, and point the frontend's `NEXT_PUBLIC_API_URL` at that hosted backend.
- If deployment time is tight, running both locally and demoing on a laptop is completely fine for a hackathon — judges care about the working demo, not the hosting setup.

---

## 9. Stretch Goal — Multi-Property Screener

If core BBB pipeline is complete with time remaining:
- Add **Tox21** dataset → train a second classifier for toxicity flags
- Add **ESOL** dataset → train a regressor for aqueous solubility
- Combine into a single "drug candidate scorecard" view showing BBB permeability + toxicity risk + solubility for one molecule at once, each with its own mini SHAP explanation
- This mimics a real early-stage multi-property screening funnel rather than a single-property tool

---

## 10. How This Maps to the Hackathon's Health Track (for your pitch materials)

**Strong alignment (state explicitly in pitch):**
- Addresses an overlooked-by-the-public (if not by science) health bottleneck: ~98% of CNS drug candidates fail due to BBB, and translating this into treatments for Alzheimer's, depression, epilepsy directly affects patient quality of life and recovery timelines.
- Practical, sustainable: replaces costly, slow lab/animal testing cycles with a fast computational filter.
- Long-term impact: shortens CNS drug development timelines industry-wide, not just for one product.

**Gap to bridge explicitly (don't leave implicit):**
- BrainGate is an upstream, researcher-facing tool, not directly patient-facing. Include one explicit slide/sentence connecting "faster candidate screening" → "earlier access to treatment for patients with brain disorders" so judges don't have to infer the patient impact themselves.

**Honest positioning vs. prior art (have this ready if asked):**
- Tools like SwissADME, pkCSM, and admetSAR already predict BBB permeability but return only a flag with no reasoning. Academic papers have applied SHAP to BBB models, but as static research, not interactive tools. BrainGate's differentiator is packaging real-time, per-molecule, plain-language explanations into an interactive demo — not claiming to be the first BBB predictor.

---

## 11. Suggested Build Order (for Antigravity to execute step by step)

**Phase 1 — Data & Model (backend/scripts, no server yet)**
1. Set up `backend/` project structure and `requirements.txt`
2. Download and clean BBBP dataset; save `bbbp_cleaned.csv`
3. Write `features.py` to compute the 7 RDKit descriptors for every molecule; save `features.csv`
4. Train baseline XGBoost model; evaluate ROC-AUC/balanced accuracy; save model artifact to `models/`
5. Add SHAP explainability logic in `explain.py`; test on a few known molecules (caffeine, etc.) via a script/notebook, not yet an API
6. Build the plain-language template mapping for SHAP outputs
7. Validate SHAP feature ranking against CNS MPO rules; produce a comparison chart (for the pitch deck, not the live app)

**Phase 2 — Backend API**
8. Build `main.py` with the `/predict`, `/examples`, `/health` endpoints per the API contract in section 8.3; wire in the model, features, and explain modules
9. Test endpoints locally with `curl`/Postman before touching the frontend at all — confirm the JSON shape matches spec exactly

**Phase 3 — Frontend**
10. Scaffold Next.js app (`create-next-app`, TypeScript + Tailwind)
11. Build `SmilesInput` and `ExampleMoleculePicker` components; wire to `/examples` and `/predict`
12. Build `PredictionCard` and `ShapBarChart` components to render the response
13. Add loading and error states (invalid SMILES, backend unreachable)
14. (If time allows) Build comparison mode: second input, `/compare` call, `ComparisonView` component

**Phase 4 — Polish**
15. Style pass (Tailwind), responsive check, write README with setup steps
16. Prepare pitch deck bridging to the health track's language (section 10)

**Stretch**
17. Add Tox21/ESOL multi-property screener as new backend endpoints + frontend tabs, only after Phases 1–4 are solid

---

## 12. Key Reference Molecules for Testing/Demo

| Molecule | SMILES | Expected BBB result |
|---|---|---|
| Caffeine | `CN1C=NC2=C1C(=O)N(C(=O)N2C)C` | Permeable |
| Diazepam | `CN1C(=O)CN=C(c2ccccc2)c2cc(Cl)ccc21` | Permeable |
| A large peptide (e.g., a known non-permeable biologic) | Use any peptide SMILES from the dataset with label 0 | Non-permeable |

(Pull exact non-permeable examples directly from your cleaned dataset to guarantee correctness rather than hand-typing SMILES for less common molecules.)
