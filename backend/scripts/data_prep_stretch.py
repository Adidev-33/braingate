import os
import sys
import pandas as pd
import numpy as np
from rdkit import Chem

# Ensure project root is in sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.app.features import compute_descriptors, FEATURE_NAMES

PROCESSED_DIR = os.path.join(PROJECT_ROOT, "backend", "data", "processed")
ESOL_PROCESSED_PATH = os.path.join(PROCESSED_DIR, "esol_processed.csv")
TOX21_PROCESSED_PATH = os.path.join(PROCESSED_DIR, "tox21_processed.csv")


def prep_esol():
    """Download, clean, and featurize the ESOL (Delaney) solubility dataset."""
    print("\n" + "=" * 70)
    print(" 1. PREPARING ESOL (DELANEY) SOLUBILITY DATASET ")
    print("=" * 70)

    import deepchem as dc
    tasks, datasets, transformers = dc.molnet.load_delaney(featurizer="Raw")
    all_df = pd.concat([d.to_dataframe() for d in datasets]).reset_index(drop=True)
    initial_count = len(all_df)
    print(f"Loaded raw ESOL dataset: {initial_count} molecules.")

    # Target column is 'y' (measured log solubility in mols per litre)
    # SMILES column is 'ids'
    records = []
    dropped_count = 0

    for idx, row in all_df.iterrows():
        smiles = str(row["ids"]).strip() if pd.notna(row.get("ids")) else ""
        y_val = row.get("y")

        if not smiles or pd.isna(y_val):
            dropped_count += 1
            continue

        mol = Chem.MolFromSmiles(smiles)
        if mol is None:
            dropped_count += 1
            continue

        canonical_smiles = Chem.MolToSmiles(mol)
        descriptors = compute_descriptors(canonical_smiles)
        if descriptors is None:
            dropped_count += 1
            continue

        record = {
            "smiles": canonical_smiles,
            "log_solubility": round(float(y_val), 4),
            **descriptors
        }
        records.append(record)

    df_esol = pd.DataFrame(records).drop_duplicates(subset=["smiles"]).reset_index(drop=True)
    os.makedirs(PROCESSED_DIR, exist_ok=True)
    df_esol.to_csv(ESOL_PROCESSED_PATH, index=False)

    print(f"ESOL Processing Summary:")
    print(f"  - Initial count: {initial_count}")
    print(f"  - Dropped unparseable/invalid: {dropped_count}")
    print(f"  - Final clean count: {len(df_esol)} molecules")
    print(f"  - Log solubility range: [{df_esol['log_solubility'].min():.2f}, {df_esol['log_solubility'].max():.2f}], Mean: {df_esol['log_solubility'].mean():.2f}")
    print(f"  - Saved to: {ESOL_PROCESSED_PATH}")
    return df_esol


def prep_tox21():
    """Download, clean, featurize, and create composite toxicity label for Tox21 dataset."""
    print("\n" + "=" * 70)
    print(" 2. PREPARING TOX21 TOXICITY DATASET ")
    print("=" * 70)

    import deepchem as dc
    tasks, datasets, transformers = dc.molnet.load_tox21(featurizer="Raw")
    all_df = pd.concat([d.to_dataframe() for d in datasets]).reset_index(drop=True)
    initial_count = len(all_df)
    print(f"Loaded raw Tox21 dataset: {initial_count} molecules across 12 assay tasks: {tasks}")

    y_cols = [f"y{i+1}" for i in range(12)]
    w_cols = [f"w{i+1}" for i in range(12)]

    records = []
    dropped_unparseable = 0
    dropped_no_labels = 0

    for idx, row in all_df.iterrows():
        smiles = str(row["ids"]).strip() if pd.notna(row.get("ids")) else ""
        if not smiles:
            dropped_unparseable += 1
            continue

        mol = Chem.MolFromSmiles(smiles)
        if mol is None:
            dropped_unparseable += 1
            continue

        # Extract 12 assay outcomes masking with weights (w=0 indicates missing measurement)
        y_vals = [row.get(y) for y in y_cols]
        w_vals = [row.get(w) for w in w_cols]

        valid_assay_outcomes = []
        for y_val, w_val in zip(y_vals, w_vals):
            if pd.notna(y_val) and pd.notna(w_val) and w_val > 0:
                valid_assay_outcomes.append(int(round(float(y_val))))

        if not valid_assay_outcomes:
            dropped_no_labels += 1
            continue

        # Composite toxicity risk: 1 if ANY tested assay is active (1), 0 otherwise
        composite_toxic = 1 if any(v == 1 for v in valid_assay_outcomes) else 0

        canonical_smiles = Chem.MolToSmiles(mol)
        descriptors = compute_descriptors(canonical_smiles)
        if descriptors is None:
            dropped_unparseable += 1
            continue

        record = {
            "smiles": canonical_smiles,
            "toxic": composite_toxic,
            "active_assays_count": sum(1 for v in valid_assay_outcomes if v == 1),
            "total_tested_assays": len(valid_assay_outcomes),
            **descriptors
        }
        records.append(record)

    df_tox = pd.DataFrame(records).drop_duplicates(subset=["smiles"]).reset_index(drop=True)
    df_tox.to_csv(TOX21_PROCESSED_PATH, index=False)

    pos_count = int(np.sum(df_tox["toxic"] == 1))
    neg_count = int(np.sum(df_tox["toxic"] == 0))
    scale_pos_weight = neg_count / pos_count if pos_count > 0 else 1.0

    print(f"Tox21 Processing Summary:")
    print(f"  - Initial count: {initial_count}")
    print(f"  - Dropped unparseable/invalid SMILES: {dropped_unparseable}")
    print(f"  - Dropped no valid assays: {dropped_no_labels}")
    print(f"  - Final clean count: {len(df_tox)} molecules")
    print(f"  - Class Balance: Toxic (1) = {pos_count} ({pos_count/len(df_tox)*100:.1f}%), Non-Toxic (0) = {neg_count} ({neg_count/len(df_tox)*100:.1f}%)")
    print(f"  - Recommended scale_pos_weight: {scale_pos_weight:.4f}")
    print(f"  - Saved to: {TOX21_PROCESSED_PATH}")
    return df_tox


if __name__ == "__main__":
    prep_esol()
    prep_tox21()
    print("\nData prep for stretch models completed successfully!")
