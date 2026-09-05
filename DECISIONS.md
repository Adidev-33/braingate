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

### 2026-09-04 — Model Architecture & Imbalance Strategy

**Decision:**
Use XGBoost classifier with `scale_pos_weight` set to ratio of negative to positive training samples (0.3071) and early stopping on a stratified validation set.

**Reason:**
BBBP dataset is imbalanced (76.5% permeable vs 23.5% non-permeable). Tree-based gradient boosting allows exact SHAP TreeExplainer calculation and high ROC-AUC performance (0.8891 achieved).

-----

### 2026-09-04 — Stretch Goal: Tox21 Composite Toxicity Risk & ESOL Regression

**Decision:**
For Tox21 multi-task toxicity modeling (12 assay targets), collapse assays into a composite biological toxicity risk flag: `toxic = 1` if active on >= 1 tested assay, `non_toxic = 0` if negative across all tested assays. For ESOL, train an XGBoost regressor predicting continuous `log_solubility` (log mol/L). Both reuse the standardized 7 RDKit descriptors and dedicated SHAP TreeExplainers.

**Reason:**
Individual Tox21 assays are extremely sparse (e.g., p53 has only 6.2% active hits, PPAR-gamma has 2.9%), which causes high label sparsity and ignores off-target liabilities in the other 11 pathways. The composite toxicity flag provides a comprehensive early-stage screening filter (36.7% toxic vs 63.3% non-toxic across 7,823 compounds) with `scale_pos_weight = 1.7264`. This directly maps to a clean `toxic` vs `non_toxic` confidence score and SHAP attribution matching the existing BBB UI patterns.

**Alternatives Considered:**
- Single-assay classifier (e.g. p53 only): Misses toxicity on other pathways (AhR, mitochondrial membrane potential, estrogen receptors).
- 12 separate multi-output classifiers: Adds excessive cognitive load to the candidate scorecard and complicates single-card UI presentation.

---

### 2026-09-05 — PDF Report Generation Engine: ReportLab & Print-Friendly Theme

**Decision:**
Use `reportlab` (v5.0.1) on the FastAPI backend for deterministic server-side PDF generation, rendering static SHAP feature attributions via `matplotlib` and structuring tables via ReportLab `Platypus`. The report uses a print-friendly high-contrast modern biotech palette (white/slate base with emerald `#059669` favorable badges and rose `#E11D48` suboptimal alerts) and accepts `PDFReportRequest(smiles, scorecard?)` to eliminate duplicate ML computation on UI exports.

**Reason:**
1. **Zero System C-Extension Dependencies:** Unlike WeasyPrint, which requires GTK/Cairo/Pango C-libraries that introduce severe installation friction on Windows, ReportLab is a pure Python / wheel package that runs reliably in any environment.
2. **Deterministic Layout & Single-Page Precision:** ReportLab Platypus enables exact margin, padding, and font-size calculations to guarantee that standard single-molecule screening dossiers fit onto a clean single page.
3. **Print-Friendly Readability:** Dark UI themes waste printer toner and produce murky grayscale output; the print-friendly light palette maintains crisp legibility both on screen and on physical paper.
4. **Backend Architecture & Stateless API:** Generating on the backend provides a direct, scriptable `POST /report/pdf` API for researchers and automation pipelines while avoiding DOM screenshot distortions from client-side canvas libraries (e.g. jsPDF / html2canvas).

**Alternatives Considered:**
- Client-side DOM screenshot (jsPDF / html2canvas): Prone to browser rendering inconsistencies, DPI blurriness, and broken page splits.
- WeasyPrint: Requires system-level GTK/Pango/Cairo DLL bindings with high installation friction on Windows.

