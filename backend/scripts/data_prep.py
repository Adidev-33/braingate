import os
import sys
import urllib.request
import pandas as pd
from rdkit import Chem

RAW_DATA_PATH = os.path.join("backend", "data", "raw", "BBBP.csv")
CLEAN_DATA_PATH = os.path.join("backend", "data", "processed", "bbbp_cleaned.csv")

DATASET_URLS = [
    "https://raw.githubusercontent.com/deepchem/deepchem/master/datasets/BBBP.csv",
    "https://deepchemdata.s3-us-west-1.amazonaws.com/datasets/BBBP.csv"
]


def download_bbbp():
    """Download raw BBBP.csv if not already present."""
    os.makedirs(os.path.dirname(RAW_DATA_PATH), exist_ok=True)
    if os.path.exists(RAW_DATA_PATH) and os.path.getsize(RAW_DATA_PATH) > 0:
        print(f"Raw dataset already exists at {RAW_DATA_PATH} ({os.path.getsize(RAW_DATA_PATH)} bytes)")
        return

    for url in DATASET_URLS:
        print(f"Attempting download from {url}...")
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=15) as response, open(RAW_DATA_PATH, 'wb') as out_file:
                out_file.write(response.read())
            print(f"Successfully downloaded BBBP.csv ({os.path.getsize(RAW_DATA_PATH)} bytes)")
            return
        except Exception as e:
            print(f"Failed to download from {url}: {e}")

    # Fallback to deepchem molnet loader if direct HTTP fails
    print("Attempting DeepChem molnet loader fallback...")
    try:
        import deepchem as dc
        tasks, datasets, transformers = dc.molnet.load_bbbp(featurizer='Raw')
        all_df = pd.concat([d.to_dataframe() for d in datasets])
        all_df.to_csv(RAW_DATA_PATH, index=False)
        print(f"Successfully loaded via DeepChem and saved to {RAW_DATA_PATH}")
        return
    except Exception as e:
        print(f"DeepChem fallback failed: {e}")
        raise RuntimeError("Could not download BBBP.csv from any source.")


def clean_bbbp():
    """Clean SMILES and deduplicate BBBP dataset."""
    print(f"Reading raw dataset from {RAW_DATA_PATH}...")
    df = pd.read_csv(RAW_DATA_PATH)
    initial_count = len(df)
    print(f"Initial raw row count: {initial_count}")

    # Ensure required columns exist
    smiles_col = "smiles" if "smiles" in df.columns else [c for c in df.columns if "smiles" in c.lower()][0]
    p_np_col = "p_np" if "p_np" in df.columns else [c for c in df.columns if "p_np" in c.lower() or "label" in c.lower()][0]

    # 1. SMILES Validation via RDKit
    valid_mask = []
    canonical_smiles = []

    for s in df[smiles_col]:
        if pd.isna(s):
            valid_mask.append(False)
            canonical_smiles.append(None)
            continue
        mol = Chem.MolFromSmiles(str(s))
        if mol is None:
            valid_mask.append(False)
            canonical_smiles.append(None)
        else:
            valid_mask.append(True)
            canonical_smiles.append(Chem.MolToSmiles(mol))

    df["canonical_smiles"] = canonical_smiles
    df_valid = df[valid_mask].copy()
    invalid_count = initial_count - len(df_valid)
    print(f"Dropped {invalid_count} invalid SMILES strings. Valid rows remaining: {len(df_valid)}")

    # 2. Deduplication with majority voting for conflicting labels
    print("Deduplicating by canonical SMILES...")
    name_col = "name" if "name" in df_valid.columns else smiles_col

    dedup_grouped = df_valid.groupby("canonical_smiles").agg(
        name=(name_col, "first"),
        p_np=(p_np_col, lambda x: int(x.mean() >= 0.5)),
        label_count=(p_np_col, "count")
    ).reset_index()

    dedup_grouped = dedup_grouped.rename(columns={"canonical_smiles": "smiles"})
    final_count = len(dedup_grouped)
    print(f"Final deduplicated molecule count: {final_count}")

    # 3. Class balance metrics
    class_counts = dedup_grouped["p_np"].value_counts().to_dict()
    perm_count = class_counts.get(1, 0)
    non_perm_count = class_counts.get(0, 0)
    perm_pct = (perm_count / final_count) * 100

    print(f"Class Balance:")
    print(f"  - Permeable (1): {perm_count} ({perm_pct:.1f}%)")
    print(f"  - Non-permeable (0): {non_perm_count} ({100 - perm_pct:.1f}%)")

    # 4. Save cleaned CSV
    os.makedirs(os.path.dirname(CLEAN_DATA_PATH), exist_ok=True)
    dedup_grouped.to_csv(CLEAN_DATA_PATH, index=False)
    print(f"Saved cleaned dataset to {CLEAN_DATA_PATH}")


if __name__ == "__main__":
    download_bbbp()
    clean_bbbp()
