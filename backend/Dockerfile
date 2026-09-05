# ──────────────────────────────────────────────────────────────────────────────
# BrainGate Backend — Dockerfile (Fixed)
#
# Key fixes vs previous version:
#   1. Uses python:3.11-slim instead of deprecated continuumio/miniconda3
#   2. RDKit installed via pip (works since 2022.09+ on Python 3.11)
#   3. WORKDIR set to /project and backend code copied to /project/backend/
#      so that "from backend.app.features import ..." resolves correctly
#   4. PYTHONPATH=/project ensures Python finds the backend package
# ──────────────────────────────────────────────────────────────────────────────
FROM python:3.11-slim

# Install system libraries required by RDKit and matplotlib
RUN apt-get update && apt-get install -y \
    libxrender1 \
    libxext6 \
    libxinerama1 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory to /project
# Backend code will be placed at /project/backend/
# so that "from backend.app.X" imports resolve correctly
WORKDIR /project

# Copy the backend folder contents into /project/backend/
# (Railway build context is the backend/ directory since Root Dir = backend)
COPY . /project/backend/

# Install all Python dependencies via pip
# RDKit is pip-installable since 2022.09 on Python 3.11 — no conda needed
RUN pip install --no-cache-dir \
    "rdkit>=2022.9.1" \
    fastapi \
    "uvicorn[standard]" \
    xgboost \
    scikit-learn \
    shap \
    pandas \
    numpy \
    "pydantic>=2.0" \
    python-multipart \
    httpx \
    reportlab \
    matplotlib \
    pillow \
    groq

# Note: deepchem and imbalanced-learn are training-only dependencies.
# They are NOT imported at runtime by the FastAPI server, so we omit them
# to keep the image lean and build times fast (~3 min vs ~15 min).

# Set PYTHONPATH so Python can resolve "from backend.app.X import ..."
ENV PYTHONPATH=/project

# Expose FastAPI port
EXPOSE 8000

# Start the server — module path must match the PYTHONPATH structure
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
