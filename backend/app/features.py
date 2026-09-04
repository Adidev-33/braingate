import os
import pandas as pd
from rdkit import Chem
from rdkit.Chem import Descriptors, Lipinski

FEATURE_NAMES = [
    "mol_weight",
    "logp",
    "tpsa",
    "h_donors",
    "h_acceptors",
    "rotatable_bonds",
    "aromatic_rings"
]

FEATURE_DISPLAY_NAMES = {
    "mol_weight": "Molecular Weight (Da)",
    "logp": "Lipophilicity (LogP)",
    "tpsa": "Topological Polar Surface Area (TPSA Å²)",
    "h_donors": "H-Bond Donors",
    "h_acceptors": "H-Bond Acceptors",
    "rotatable_bonds": "Rotatable Bonds",
    "aromatic_rings": "Aromatic Rings"
}


def compute_descriptors(smiles: str) -> dict | None:
    """
    Computes the 7 core RDKit molecular descriptors for a SMILES string.
    Returns a dictionary of features, or None if the SMILES string cannot be parsed.
    """
    if not smiles or not isinstance(smiles, str):
        return None

    mol = Chem.MolFromSmiles(smiles.strip())
    if mol is None:
        return None

    try:
        mw = float(Descriptors.MolWt(mol))
        logp = float(Descriptors.MolLogP(mol))
        tpsa = float(Descriptors.TPSA(mol))
        h_donors = int(Descriptors.NumHDonors(mol))
        h_acceptors = int(Descriptors.NumHAcceptors(mol))
        rotatable_bonds = int(Descriptors.NumRotatableBonds(mol))
        aromatic_rings = int(Lipinski.NumAromaticRings(mol))

        return {
            "mol_weight": round(mw, 2),
            "logp": round(logp, 2),
            "tpsa": round(tpsa, 2),
            "h_donors": h_donors,
            "h_acceptors": h_acceptors,
            "rotatable_bonds": rotatable_bonds,
            "aromatic_rings": aromatic_rings
        }
    except Exception:
        return None


def generate_features_dataset(
    cleaned_csv_path: str = os.path.join("backend", "data", "processed", "bbbp_cleaned.csv"),
    output_features_path: str = os.path.join("backend", "data", "processed", "features_df.csv")
) -> pd.DataFrame:
    """
    Reads the cleaned BBBP dataset, computes descriptors for all molecules,
    and saves the features table to disk.
    """
    if not os.path.exists(cleaned_csv_path):
        raise FileNotFoundError(f"Cleaned dataset not found at {cleaned_csv_path}. Run data_prep.py first.")

    print(f"Reading cleaned dataset from {cleaned_csv_path}...")
    df = pd.read_csv(cleaned_csv_path)

    features_list = []
    valid_indices = []

    for idx, row in df.iterrows():
        desc = compute_descriptors(row["smiles"])
        if desc is not None:
            features_list.append(desc)
            valid_indices.append(idx)
        else:
            print(f"Warning: Failed to compute descriptors for index {idx}, smiles: {row['smiles']}")

    df_features = pd.DataFrame(features_list)

    # Attach metadata and label
    df_result = pd.concat([df.loc[valid_indices, ["name", "smiles", "p_np"]].reset_index(drop=True), df_features], axis=1)

    os.makedirs(os.path.dirname(output_features_path), exist_ok=True)
    df_result.to_csv(output_features_path, index=False)
    print(f"Successfully computed features for {len(df_result)} molecules. Saved to {output_features_path}")

    return df_result


if __name__ == "__main__":
    generate_features_dataset()
