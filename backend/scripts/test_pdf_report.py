import sys
import os
import fitz  # PyMuPDF
from fastapi.testclient import TestClient

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.app.main import app

def test_pdf_generation():
    client = TestClient(app)
    
    test_cases = [
        ("Caffeine", "CN1C=NC2=C1C(=O)N(C(=O)N2C)C"),
        ("Diazepam", "CN1C(=O)CN=C(c2ccccc2)c2cc(Cl)ccc21"),
        ("Atenolol", "CC(C)NCC(O)COc1ccc(CC(N)=O)cc1"),
    ]
    
    output_dir = os.path.join(PROJECT_ROOT, "backend", "test_output")
    os.makedirs(output_dir, exist_ok=True)
    
    for name, smiles in test_cases:
        print(f"\n--- Testing PDF Report for {name} ({smiles}) ---")
        response = client.post("/report/pdf", json={"smiles": smiles, "molecule_name": name})
        
        assert response.status_code == 200, f"Failed with {response.status_code}: {response.text}"
        assert response.headers.get("content-type") == "application/pdf"
        assert response.content.startswith(b"%PDF-"), "Response does not start with PDF magic header"
        
        pdf_path = os.path.join(output_dir, f"report_{name}.pdf")
        with open(pdf_path, "wb") as f:
            f.write(response.content)
            
        print(f"Saved PDF to: {pdf_path} (Size: {len(response.content):,} bytes)")
        
        # Render pages to PNG using PyMuPDF to inspect visuals
        doc = fitz.open(pdf_path)
        print(f"Total pages: {len(doc)}")
        for page_idx, page in enumerate(doc):
            pix = page.get_pixmap(dpi=150)
            png_path = os.path.join(output_dir, f"report_{name}_page_{page_idx+1}.png")
            pix.save(png_path)
            print(f"Rendered Page {page_idx+1} to PNG: {png_path} ({pix.width}x{pix.height})")
            
    print("\nAll PDF test cases generated and verified successfully!")

if __name__ == "__main__":
    test_pdf_generation()
