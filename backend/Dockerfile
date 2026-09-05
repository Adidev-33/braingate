# ──────────────────────────────────────────────────────────────────────────────
# BrainGate Backend — Dockerfile
# Base: continuumio/miniconda3 ensures RDKit C++ bindings install cleanly
# via conda-forge without compilation issues on Linux containers.
# ──────────────────────────────────────────────────────────────────────────────
FROM continuumio/miniconda3:latest

# Set working directory inside container
WORKDIR /app

# Install RDKit via conda-forge (most reliable method for production)
RUN conda install -y -c conda-forge rdkit && conda clean -afy

# Copy Python requirements and install remaining pip dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir \
    fastapi \
    "uvicorn[standard]" \
    xgboost \
    scikit-learn \
    shap \
    pandas \
    numpy \
    pydantic \
    python-multipart \
    httpx \
    reportlab \
    matplotlib \
    pillow \
    groq

# Note: deepchem and imbalanced-learn are only needed for training scripts.
# They are NOT required at runtime for the FastAPI inference server.
# Omitting them keeps the Docker image lean (~1.2GB vs ~3.5GB).

# Copy the entire project into the container
COPY . .

# Expose the FastAPI port
EXPOSE 8000

# Start the FastAPI server
# PROJECT_ROOT must be /app so Python imports resolve correctly
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
