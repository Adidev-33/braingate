# BrainGate — Explainable Blood-Brain Barrier (BBB) Permeability Predictor

BrainGate is an explainable machine learning tool that predicts whether candidate drug molecules can cross the blood-brain barrier (BBB), presenting feature reasoning in plain, chemist-readable language (powered by SHAP feature explanations) rather than a black-box score.

---

## 1. Problem Statement & Value Proposition

Roughly **98% of small-molecule drug candidates** for neurological conditions (Alzheimer's, depression, epilepsy, brain tumors) fail because they cannot cross the blood-brain barrier — regardless of how biologically effective they are. Existing prediction tools (SwissADME, pkCSM, admetSAR) provide a binary yes/no flag with no explanation. 

BrainGate adds a real-time, per-molecule, plain-English explanation layer (via SHAP) on top of an accurate XGBoost classifier (**0.8891 ROC-AUC**), turning a black-box screen into an interpretable decision-support tool that mirrors how a medicinal chemist actually reasons.

---

## 2. Technology Stack

| Layer | Component | Technologies Used |
|---|---|---|
| **Backend API** | REST Microservice | FastAPI, Uvicorn ASGI Server, Pydantic v2 |
| **Cheminformatics** | Descriptors & Parsing | RDKit (`Chem`, `Descriptors`, `Lipinski`) |
| **Machine Learning** | Classifier & Balance | XGBoost (`scale_pos_weight` = 0.3071), scikit-learn |
| **Explainability** | Local Feature Attribution | SHAP (`TreeExplainer`), Custom Rules Mapper |
| **Frontend UI** | Web Interface | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS |
| **Data Visualization** | Interactive Charts | Recharts, Lucide React, Material Symbols |
| **Design System** | UI Source of Truth | Converted from Google Stitch (`stitch_braingate_bbb_predictor/`) |

---

## 3. System Architecture

```
┌────────────────────────────────────────────────────────┐
│               Next.js Frontend (Port 3000)             │
│   - SmilesInput & ExampleMoleculePicker                │
│   - PredictionCard (Confidence Gauge & Rationale)      │
│   - ShapBarChart (Recharts Dynamic Waterfall)          │
│   - FeaturesTable (Computed Descriptors vs CNS MPO)    │
│   - ComparisonView (Side-by-side /compare endpoint)    │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP JSON / CORS
                            ▼
┌────────────────────────────────────────────────────────┐
│                FastAPI Backend (Port 8000)             │
│   - POST /predict   ──▶ RDKit Descriptors ──▶ XGBoost  │
│   - GET  /examples  ──▶ Curated Benchmark Controls    │
│   - POST /compare   ──▶ Dual Inference + Deciding Diff │
│   - GET  /health    ──▶ Liveness Check & Model Status  │
└───────────────────────────┬────────────────────────────┘
                            │ Loads at startup
                            ▼
┌────────────────────────────────────────────────────────┐
│           Trained ML Artifacts & Explainability        │
│   - backend/models/xgb_bbbp_model.pkl (248 KB)         │
│   - shap.TreeExplainer live feature attribution        │
│   - backend/data/processed/bbbp_cleaned.csv            │
└────────────────────────────────────────────────────────┘
```

---

## 4. Full Step-by-Step Installation & Setup Guide

### Prerequisites
Make sure the following software is installed on your system before proceeding:
- **Python**: Version `3.10` or higher ([python.org](https://www.python.org/))
- **Node.js**: Version `18.0` or higher ([nodejs.org](https://nodejs.org/))
- **Git**: Version `2.x` ([git-scm.com](https://git-scm.com/))

---

### Step 1: Clone / Navigate to the Project Repository
```bash
git clone https://github.com/your-username/braingate.git
cd braingate
```

---

### Step 2: Set Up Python Virtual Environment (`venv`)

This project **must** run inside a Python virtual environment to ensure RDKit native C++ bindings and XGBoost libraries load cleanly.

#### On Windows (PowerShell):
```powershell
python -m venv venv
venv\Scripts\activate
```

#### On Linux / macOS (Bash / Terminal):
```bash
python3 -m venv venv
source venv/bin/activate
```

> **Note**: Always verify your shell prompt shows `(venv)` before installing requirements or running Python commands.

---

### Step 3: Install Backend Python Dependencies

Inside the active virtual environment, install all backend requirements:
```bash
pip install -r backend/requirements.txt
```

#### Verification:
Test that core backend packages installed cleanly:
```bash
python -c "import rdkit; import xgboost; import shap; import fastapi; print('Backend dependencies loaded successfully!')"
```

---

### Step 4: (Optional) Re-run ML Data Prep & Training Pipeline

The repository already includes the pre-trained ML model artifact ([`backend/models/xgb_bbbp_model.pkl`](file:///c:/Users/adide/Music/braingate/backend/models/xgb_bbbp_model.pkl)) and cleaned dataset ([`backend/data/processed/bbbp_cleaned.csv`](file:///c:/Users/adide/Music/braingate/backend/data/processed/bbbp_cleaned.csv)).

If you wish to re-download raw data, re-extract descriptors, or retrain the model from scratch, execute the following scripts in order:

```bash
# 1. Download & clean raw MoleculeNet BBBP dataset
python backend/scripts/data_prep.py

# 2. Extract 7 RDKit molecular descriptors for all molecules
python backend/app/features.py

# 3. Train XGBoost binary classifier & save model artifact
python backend/scripts/train_model.py

# 4. Run SHAP explainer on Caffeine example
python backend/app/explain.py

# 5. Run scientific validation against CNS MPO rules
python backend/scripts/validate_rules.py
```

---

### Step 5: Install Frontend Node.js Dependencies

Open a new terminal window, navigate to the `frontend/` directory, and install npm packages:

```bash
cd frontend
npm install
```

---

### Step 6: Configure Environment Variables

Create a `.env.local` file inside `frontend/` pointing to the FastAPI backend service:

**`frontend/.env.local`**:
```ini
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

### Step 7: Run the Application

You need to run both the FastAPI backend and Next.js frontend concurrently.

#### Terminal 1 — Start FastAPI Backend (Port 8000):
```powershell
# Windows PowerShell
venv\Scripts\activate
cd backend
uvicorn app.main:app --reload --port 8000
```

```bash
# Linux / macOS
source venv/bin/activate
cd backend
uvicorn app.main:app --reload --port 8000
```

#### Terminal 2 — Start Next.js Frontend (Port 3000):
```bash
cd frontend
npm run dev
```

#### Open Web Browser:
Navigate to **`http://localhost:3000`** in your browser to interact with the BrainGate web application.

---

## 5. API Contract Documentation

The FastAPI microservice runs on `http://localhost:8000` (Interactive Swagger docs available at `http://localhost:8000/docs`).

### `GET /health`
Liveness check verifying API readiness and model load status.
- **Response (HTTP 200)**:
  ```json
  {
    "status": "healthy",
    "model_loaded": true
  }
  ```

---

### `GET /examples`
Returns pre-curated reference benchmark molecules for UI quick-testing.
- **Response (HTTP 200)**:
  ```json
  [
    {
      "name": "Caffeine",
      "smiles": "CN1C=NC2=C1C(=O)N(C(=O)N2C)C",
      "known_label": "permeable",
      "description": "Central nervous system stimulant found in coffee and tea. Readily crosses the blood-brain barrier."
    },
    {
      "name": "Diazepam",
      "smiles": "CN1C(=O)CN=C(c2ccccc2)c2cc(Cl)ccc21",
      "known_label": "permeable",
      "description": "Benzodiazepine medication (Valium) used to treat anxiety and seizures. Highly brain-permeable."
    },
    {
      "name": "Atenolol",
      "smiles": "CC(C)NCC(O)COc1ccc(CC(N)=O)cc1",
      "known_label": "non_permeable",
      "description": "Hydrophilic beta-blocker used for hypertension. Minimal central nervous system penetration."
    },
    {
      "name": "Dopamine",
      "smiles": "NCCc1ccc(O)c(O)c1",
      "known_label": "non_permeable",
      "description": "Endogenous neurotransmitter. Polar catecholamine structure prevents direct passive BBB penetration."
    }
  ]
  ```

---

### `POST /predict`
Computes 7 RDKit descriptors, runs XGBoost model prediction, and generates SHAP feature contribution explanations.
- **Request Body**:
  ```json
  {
    "smiles": "CN1C=NC2=C1C(=O)N(C(=O)N2C)C"
  }
  ```
- **Response Body (HTTP 200 OK)**:
  ```json
  {
    "valid_smiles": true,
    "prediction": "permeable",
    "confidence": 0.8076,
    "permeable_probability": 0.8076,
    "features": {
      "mol_weight": 194.19,
      "logp": -1.03,
      "tpsa": 61.82,
      "h_donors": 0,
      "h_acceptors": 3,
      "rotatable_bonds": 0,
      "aromatic_rings": 2
    },
    "shap_explanation": [
      {
        "feature": "h_donors",
        "display_name": "H-Bond Donors",
        "value": 0,
        "shap_value": 0.7096,
        "plain_text": "Low H-bond donor count (0) prevents excessive energy penalty when entering lipid bilayers."
      },
      {
        "feature": "mol_weight",
        "display_name": "Molecular Weight (Da)",
        "value": 194.19,
        "shap_value": 0.3886,
        "plain_text": "Compact molecular size (MW = 194.19 Da <= 450 Da) facilitates rapid passive diffusion."
      }
    ],
    "summary_sentence": "Predicted to cross the BBB, primarily driven by favorable h-bond donors and molecular weight."
  }
  ```
- **Invalid SMILES Response (HTTP 422 Unprocessable Entity)**:
  ```json
  {
    "valid_smiles": false,
    "error": "Could not parse SMILES string 'INVALID_SMILES_123'. Please enter a valid chemical structure."
  }
  ```

---

### `POST /compare`
Side-by-side comparative analysis of two candidate molecules.
- **Request Body**:
  ```json
  {
    "smiles1": "CN1C=NC2=C1C(=O)N(C(=O)N2C)C",
    "smiles2": "NCCc1ccc(O)c(O)c1"
  }
  ```
- **Response Body (HTTP 200 OK)**: Object containing `molecule1` prediction object, `molecule2` prediction object, and `deciding_difference` string.

---

### `POST /report/pdf`
Generates a publication-grade, print-friendly PDF candidate summary dossier including prediction classification, confidence, 7 computed RDKit descriptors with CNS MPO compliance status, embedded static SHAP horizontal bar chart, multi-property scorecard (Tox21 & ESOL), and executive verdict.
- **Request Body**:
  ```json
  {
    "smiles": "CN1C=NC2=C1C(=O)N(C(=O)N2C)C",
    "molecule_name": "Caffeine"
  }
  ```
- **Response**: Binary stream (`Content-Type: application/pdf`, `Content-Disposition: attachment; filename="braingate_report_Caffeine.pdf"`).
- **CLI/cURL Test Command**:
  ```bash
  curl -X POST "http://localhost:8000/report/pdf" \
    -H "Content-Type: application/json" \
    -d "{\"smiles\": \"CN1C=NC2=C1C(=O)N(C(=O)N2C)C\", \"molecule_name\": \"Caffeine\"}" \
    --output braingate_report_Caffeine.pdf
  ```

---

## 6. Model Performance & Scientific Validation

### Test Set Evaluation Metrics (Held-Out Test Set):
- **ROC-AUC Score**: **0.8891** (Surpasses published target benchmark range of >0.85)
- **Balanced Accuracy**: 0.7723
- **Precision**: 0.9051
- **Recall**: 0.8212
- **F1 Score**: 0.8611

### Scientific Validation vs CNS MPO Guidelines:
Global SHAP feature importance evaluated across the held-out test set ([`validate_rules.py`](file:///c:/Users/adide/Music/braingate/backend/scripts/validate_rules.py)):

| Rank | Feature | Mean \|SHAP\| Impact | CNS MPO Guideline Match |
|---|---|---:|---|
| **#1** | **Topological Polar Surface Area (TPSA)** | **0.9529** | **Top predictor (Matches TPSA < 90 Å² rule)** |
| **#2** | **H-Bond Donors** | **0.5437** | **Key desolvation barrier factor** |
| **#3** | **Lipophilicity (LogP)** | **0.3466** | **Optimal membrane partitioning (LogP 1–4)** |
| **#4** | **Molecular Weight (MW)** | **0.2718** | **Passive diffusion limit (MW < 450 Da)** |
| **#5** | **Rotatable Bonds** | **0.2171** | **Conformational entropy penalty** |
| **#6** | **Aromatic Rings** | **0.1216** | **π-stacking lipid interaction** |
| **#7** | **H-Bond Acceptors** | **0.0966** | **Polar solvation influence** |

> **Key Takeaway**: TPSA naturally emerged as the **#1 single strongest feature** (0.9529 mean \|SHAP\|) without hardcoded rules, proving that the model learned real medicinal chemistry.

---

## 7. Known Limitations & Troubleshooting

1. **Virtual Environment Required**: Running Python scripts outside `venv` may cause RDKit C++ binding errors. Always activate `venv` before executing backend commands.
2. **Windows PowerShell Execution Policy**: If PowerShell blocks script activation (`venv\Scripts\activate`), run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process` in your shell session.
3. **CORS Policy**: If the Next.js frontend cannot reach the backend, verify `NEXT_PUBLIC_API_URL=http://localhost:8000` is present in `frontend/.env.local`.

---

## 8. License & References

- **Dataset**: MoleculeNet BBBP (Blood-Brain Barrier Penetration) collection ([MoleculeNet Benchmark](http://moleculenet.ai/)).
- **Documentation**: Managed according to project development standards in [`PROJECT_STATUS.md`](file:///c:/Users/adide/Music/braingate/PROJECT_STATUS.md) and [`HANDOFF.md`](file:///c:/Users/adide/Music/braingate/HANDOFF.md).
