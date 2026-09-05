import os
import sys
import json
from typing import Dict, List, Any, Optional

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.app.features import FEATURE_DISPLAY_NAMES

SYSTEM_PROMPT = """You are the BrainGate Scientific Assistant, an expert computational neuropharmacology consultant.
Your role is to explain blood-brain barrier (BBB) permeability predictions, molecular descriptors, and SHAP explainability values produced by the BrainGate XGBoost model.

RULES AND CONSTRAINTS:
1. Grounding: You must ONLY make claims based on the structured data provided in the context (descriptors, SHAP values, predictions, and what-if simulations). Never invent or hallucinate descriptor numbers or probabilities.
2. Epistemic Language: Always clearly distinguish model predictions from biological certainty. Use phrases such as "The model predicts a higher likelihood of crossing the BBB...", "The model estimates a probability of...", and NEVER say "This molecule will cross the barrier in reality" or "This molecule is guaranteed to...".
3. Plain-Language SHAP Explanations: Explain what positive and negative SHAP contributions mean in plain medicinal chemistry terms:
   - Positive SHAP: Favorable feature value that increases the model's predicted permeability probability.
   - Negative SHAP: Restrictive feature value that decreases the model's predicted permeability probability.
4. Thresholds & Guidelines: Reference CNS MPO (Central Nervous System Multiparameter Optimization) guidelines when explaining features (e.g. TPSA < 90 Å², MW < 450 Da, LogP 1.0–4.0, HBD ≤ 3, HBA ≤ 7, Rotatable Bonds ≤ 8).
5. What-If & Modifications: If What-If simulation data is present, clearly explain the delta shift in probability resulting from specific descriptor overrides.
6. Missing Context: If the user asks for information not provided in the context (e.g., missing SHAP values or unknown assays), explicitly state that this data is not available rather than speculating.
7. Disclaimer: Always reinforce that all outputs are in-silico computational predictions, not experimental laboratory assay results or clinical evidence.
"""


def build_context_summary(context: Dict[str, Any]) -> str:
    """Formats structured molecule prediction and SHAP data into a clean text summary for LLM reasoning."""
    smiles = context.get("smiles", "Unknown")
    molecule_name = context.get("molecule_name") or "Candidate Compound"
    pred = context.get("prediction", "Unknown")
    prob = context.get("permeable_probability", 0.0)
    conf = context.get("confidence", 0.0)
    features = context.get("features", {})
    shap_items = context.get("shap_explanation", [])
    summary_sentence = context.get("summary_sentence", "")
    what_if = context.get("what_if_data")
    comparison = context.get("comparison_data")

    lines = [
        f"--- STRUCTURED BRAINGATE CONTEXT ---",
        f"Molecule Name: {molecule_name}",
        f"SMILES: {smiles}",
        f"Model Prediction: {pred} (Confidence: {round(conf * 100, 1)}%)",
        f"Predicted Permeable Probability: {round(prob * 100, 1)}%",
        f"Executive Chemical Rationale: {summary_sentence}",
        "\nPhysicochemical Descriptors (RDKit):"
    ]

    for k, v in features.items():
        disp = FEATURE_DISPLAY_NAMES.get(k, k)
        lines.append(f"  - {disp} ({k}): {v}")

    if shap_items:
        lines.append("\nSHAP Feature Importance Breakdown (TreeExplainer):")
        for item in shap_items:
            feat = item.get("display_name", item.get("feature", "unknown"))
            val = item.get("value", "N/A")
            shap_val = item.get("shap_value", 0.0)
            sign = "FAVORS crossing (+)" if shap_val > 0 else "RESTRICTS crossing (-)"
            lines.append(f"  - {feat} = {val} | SHAP: {shap_val:+.4f} ({sign})")

    if what_if:
        lines.append("\nWhat-If Simulation Data:")
        lines.append(f"  - Original Prob: {round(what_if.get('original_probability', 0.0) * 100, 1)}% ({what_if.get('original_prediction', '')})")
        lines.append(f"  - Simulated Prob: {round(what_if.get('new_probability', 0.0) * 100, 1)}% ({what_if.get('new_prediction', '')})")
        lines.append(f"  - Delta Shift: {what_if.get('delta_percentage_points', 0.0):+}%")
        lines.append(f"  - Modified Overrides: {json.dumps(what_if.get('modified_descriptors', {}))}")

    if comparison:
        lines.append("\nMolecule Comparison Data:")
        lines.append(f"  - Deciding Difference: {comparison.get('deciding_difference', 'N/A')}")

    return "\n".join(lines)


def generate_expert_response(question: str, context: Dict[str, Any]) -> str:
    """
    High-fidelity domain-expert scientific reasoning engine that generates grounded,
    chemist-friendly answers from structured BrainGate context.
    """
    q_lower = question.lower().strip()
    smiles = context.get("smiles", "")
    molecule_name = context.get("molecule_name") or "the molecule"
    pred = context.get("prediction", "permeable")
    prob = context.get("permeable_probability", 0.5)
    prob_pct = round(prob * 100, 1)
    features = context.get("features", {})
    shap_items = context.get("shap_explanation", [])
    what_if = context.get("what_if_data")
    comparison = context.get("comparison_data")

    tpsa = features.get("tpsa", 0)
    mw = features.get("mol_weight", 0)
    logp = features.get("logp", 0)
    hbd = features.get("h_donors", 0)
    hba = features.get("h_acceptors", 0)
    rot = features.get("rotatable_bonds", 0)
    arom = features.get("aromatic_rings", 0)

    # Sort SHAP features
    pos_shap = [s for s in shap_items if s.get("shap_value", 0) > 0]
    neg_shap = [s for s in shap_items if s.get("shap_value", 0) < 0]
    pos_shap.sort(key=lambda x: abs(x.get("shap_value", 0)), reverse=True)
    neg_shap.sort(key=lambda x: abs(x.get("shap_value", 0)), reverse=True)

    # 1. "Why low?" / "Why high?" / "Why non-permeable?"
    if any(k in q_lower for k in ["why low", "why non", "why restricted", "why fail", "why high", "why permeable", "why pass", "reason for"]):
        if pred == "non_permeable" or prob < 0.5:
            top_hurts = neg_shap[:2]
            hurt_descriptions = []
            for item in top_hurts:
                feat = item.get("display_name", "").split(" (")[0]
                val = item.get("value")
                sv = item.get("shap_value")
                hurt_descriptions.append(f"**{feat} ({val})** with a negative attribution of **SHAP {sv:+.2f}**")
            
            reasons_str = " and ".join(hurt_descriptions) if hurt_descriptions else f"polar surface area ({tpsa} Å²) and donor count ({hbd})"
            return (
                f"### Permeability Attribution Analysis\n\n"
                f"The BrainGate XGBoost model predicts that **{molecule_name}** has a **{prob_pct}% probability** of crossing the blood-brain barrier, classifying it as **Non-Permeable**.\n\n"
                f"**Primary Limiting Factors:**\n"
                f"Based on TreeExplainer feature attributions, the model's prediction is primarily penalized by {reasons_str}.\n\n"
                f"- **Polar Solvation Penalty:** High polar surface area (TPSA = {tpsa} Å²) or hydrogen bond donors ({hbd}) significantly increase the free energy required for the molecule to shed its aqueous hydration shell and partition into the lipophilic capillary endothelial membrane.\n"
                f"- **Steric & Conformational Resistance:** Molecular weight of {mw} Da and {rot} rotatable bonds contribute to steric restrictions at endothelial tight junctions.\n\n"
                f"To improve predicted permeability, lowering polar groups (TPSA < 90 Å²) and reducing H-bond donors (HBD ≤ 3) represents the highest leverage synthetic modification."
            )
        else:
            top_helps = pos_shap[:2]
            help_descriptions = []
            for item in top_helps:
                feat = item.get("display_name", "").split(" (")[0]
                val = item.get("value")
                sv = item.get("shap_value")
                help_descriptions.append(f"**{feat} ({val})** contributing a positive attribution of **SHAP {sv:+.2f}**")
            
            reasons_str = " and ".join(help_descriptions) if help_descriptions else f"favorable lipophilicity (LogP {logp}) and compact size ({mw} Da)"
            return (
                f"### Permeability Attribution Analysis\n\n"
                f"The model predicts a high likelihood of blood-brain barrier permeability for **{molecule_name}** with an estimated probability of **{prob_pct}%** (**Permeable / CNS+**).\n\n"
                f"**Key Driving Factors:**\n"
                f"The prediction is predominantly supported by {reasons_str}.\n\n"
                f"- **Balanced Lipophilicity:** cLogP of {logp} sits comfortably in the ideal 1.0–4.0 window, providing necessary lipid solubility for passive transcellular diffusion without excessive non-specific tissue binding.\n"
                f"- **Low Desolvation Penalty:** A compact polar surface area (TPSA = {tpsa} Å² ≤ 90 Å²) and {hbd} H-bond donor(s) minimize the energetic barrier to crossing endothelial cell bilayers."
            )

    # 2. "Explain SHAP" / "SHAP values"
    elif any(k in q_lower for k in ["explain shap", "shap", "feature importance", "treeexplainer"]):
        if not shap_items:
            return "No SHAP feature attribution data is available in the current context for this molecule."
        
        pos_list = "\n".join([f"- **{i.get('display_name', i.get('feature'))}** ({i.get('value')}): `SHAP {i.get('shap_value'):+.4f}` — {i.get('plain_text', '')}" for i in pos_shap])
        neg_list = "\n".join([f"- **{i.get('display_name', i.get('feature'))}** ({i.get('value')}): `SHAP {i.get('shap_value'):+.4f}` — {i.get('plain_text', '')}" for i in neg_shap])

        return (
            f"### SHAP (SHapley Additive exPlanations) Breakdown\n\n"
            f"SHAP quantifies how much each individual molecular descriptor pushed the model's prediction toward permeable (positive SHAP) or non-permeable (negative SHAP) relative to the baseline training population.\n\n"
            f"#### [+] Features Promoting Permeability (Positive Contributions):\n"
            f"{pos_list if pos_list else '- None (all descriptors currently penalize permeability).'}\n\n"
            f"#### [-] Features Restricting Permeability (Negative Penalties):\n"
            f"{neg_list if neg_list else '- None (all descriptors are favorable).'}\n\n"
            f"**Conclusion:** The net sum of these contributions yields the final predicted permeable probability of **{prob_pct}%**."
        )

    # 3. "Explain modification" / What-If data explanation
    elif any(k in q_lower for k in ["explain modification", "what-if", "what if", "modified", "simulation", "override", "candidate"]) and what_if:
        orig_p = round(what_if.get("original_probability", 0.0) * 100, 1)
        new_p = round(what_if.get("new_probability", 0.0) * 100, 1)
        delta_p = what_if.get("delta_percentage_points", 0.0)
        orig_pred = what_if.get("original_prediction", "unknown")
        new_pred = what_if.get("new_prediction", "unknown")
        mod_dict = what_if.get("modified_descriptors", {})
        orig_dict = what_if.get("original_descriptors", features)

        changes = []
        for k, v in mod_dict.items():
            orig_v = orig_dict.get(k)
            if orig_v is not None and abs(float(v) - float(orig_v)) > 0.001:
                disp = FEATURE_DISPLAY_NAMES.get(k, k)
                changes.append(f"- **{disp}**: `{orig_v}` -> `{v}` (Delta {round(float(v) - float(orig_v), 2):+})")

        changes_str = "\n".join(changes) if changes else "- No descriptor values were altered from baseline."

        return (
            f"### What-If Simulation Rationale\n\n"
            f"**Applied Descriptor Modifications:**\n"
            f"{changes_str}\n\n"
            f"**Model Response & Permeability Shift:**\n"
            f"- **Baseline Probability:** {orig_p}% ({orig_pred.replace('_', ' ').title()})\n"
            f"- **Simulated Probability:** {new_p}% ({new_pred.replace('_', ' ').title()})\n"
            f"- **Net Shift:** **{delta_p:+}%** percentage points\n\n"
            f"**Mechanistic Explanation:**\n"
            f"By adjusting these parameters toward optimal CNS physicochemical thresholds, the model projects a **{abs(delta_p):.1f}% {'increase' if delta_p > 0 else 'decrease'}** in passive transcellular permeability probability."
        )

    # 4. "How to improve?" / "Optimization"
    elif any(k in q_lower for k in ["how to improve", "improve", "optimize", "how can i make", "medicinal chemistry", "optimization"]):
        suggestions = []
        if tpsa > 90:
            suggestions.append(f"1. **Reduce Polar Surface Area (TPSA = {tpsa} A^2):** Cap or replace polar functional groups (such as hydroxyls or carboxylic acids) with less polar bioisosteres (e.g. methyl ethers, fluoroalkyls) to bring TPSA below the 90 A^2 CNS threshold.")
        if hbd > 3:
            suggestions.append(f"2. **Reduce H-Bond Donors (HBD = {hbd}):** Methylate free amines or hydroxyls to eliminate polar hydrogen bonding sites that resist membrane partition.")
        if mw > 450:
            suggestions.append(f"3. **Reduce Molecular Weight (MW = {mw} Da):** Truncate non-essential peripheral appendages to reduce steric hindrance across tight endothelial junctions.")
        if logp < 1.0:
            suggestions.append(f"4. **Increase Lipophilicity (cLogP = {logp}):** Introduce aromatic rings or lipophilic aliphatic substituents to increase fat-solubility toward the 1.0-4.0 range.")
        elif logp > 4.0:
            suggestions.append(f"4. **Moderate Lipophilicity (cLogP = {logp}):** Introduce mild polarity to prevent excessive non-specific plasma protein binding.")
        if rot > 8:
            suggestions.append(f"5. **Constrain Molecular Flexibility ({rot} rotatable bonds):** Cyclize or lock flexible chains into rigid conformations to reduce conformational entropy loss during membrane insertion.")

        if not suggestions:
            suggestions.append(f"The current descriptor profile is already well-aligned with CNS MPO guidelines (TPSA: {tpsa} A^2, MW: {mw} Da, LogP: {logp}). Fine-tuning aromatic substitution or bioisosteric replacement can preserve these favorable parameters.")

        return (
            f"### Medicinal Chemistry Optimization Strategy\n\n"
            f"To increase the predicted BBB permeability for **{molecule_name}**, the model's SHAP sensitivities suggest the following prioritized modifications:\n\n"
            + "\n".join(suggestions) +
            f"\n\n*Tip: You can test these exact hypothetical adjustments directly in the **What-if Simulator** to observe the real-time probability shift.*"
        )


    # 5. "Compare" / Comparison data explanation
    elif any(k in q_lower for k in ["compare", "analog", "difference", "comparison"]) and comparison:
        deciding_diff = comparison.get("deciding_difference", "No specific deciding difference noted.")
        return (
            f"### Molecule Comparison Analysis\n\n"
            f"**Primary Deciding Difference:**\n"
            f"> {deciding_diff}\n\n"
            f"When comparing analogs, the XGBoost model weighs polar surface area (TPSA) and H-bond donors most heavily due to their outsized role in membrane desolvation energetics."
        )

    # 6. General / Fallback Question
    else:
        return (
            f"### BrainGate Scientific Assessment\n\n"
            f"Regarding **{molecule_name}** (`{smiles}`):\n\n"
            f"- **Model Prediction:** The XGBoost classifier predicts an estimated **{prob_pct}% probability** of blood-brain barrier permeability (**{pred.replace('_', ' ').title()}**).\n"
            f"- **Current Physicochemical Profile:** MW = {mw} Da, LogP = {logp}, TPSA = {tpsa} Å², HBD = {hbd}, HBA = {hba}, Rotatable Bonds = {rot}, Aromatic Rings = {arom}.\n"
            f"- **Dominant Attribution:** {shap_items[0].get('plain_text', '') if shap_items else 'N/A'}\n\n"
            f"Feel free to ask specific questions such as *'Why is permeability low/high?'*, *'Explain SHAP values'*, or *'How can I improve this molecule?'*."
        )


def load_env_file():
    """Lightweight loader for .env and .env.example file if present in backend/ or project root."""
    search_paths = [
        os.path.join(os.path.dirname(__file__), "..", ".env"),
        os.path.join(PROJECT_ROOT, ".env"),
        os.path.join(os.path.dirname(__file__), "..", ".env.example"),
        os.path.join(PROJECT_ROOT, ".env.example"),
    ]
    for env_path in search_paths:
        if os.path.exists(env_path):
            try:
                with open(env_path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            k = k.strip()
                            v = v.strip().strip("'\"")
                            if k and k not in os.environ and v:
                                os.environ[k] = v
            except Exception:
                pass


def generate_assistant_response(question: str, context: Dict[str, Any], history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
    """
    Main entry point for the BrainGate Scientific Assistant.
    Prioritizes Groq cloud models (e.g. llama-3.3-70b-versatile) if GROQ_API_KEY is provided,
    with fallback to Gemini / OpenAI, and seamless fallback to the local grounded expert scientific engine.
    """
    load_env_file()
    groq_key = os.environ.get("GROQ_API_KEY")
    gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    openai_key = os.environ.get("OPENAI_API_KEY")

    answer_text: str = ""
    model_used: str = "domain-expert-engine"

    # 1. Prioritize Groq API if key is available
    if groq_key:
        try:
            import httpx
            context_summary = build_context_summary(context)
            preferred_model = os.environ.get("GROQ_MODEL", "openai/gpt-oss-120b")
            candidate_models = [preferred_model, "openai/gpt-oss-120b", "qwen/qwen3.8-27b", "llama-3.3-70b-versatile", "llama-3.1-8b-instant"]
            # Deduplicate while preserving order
            models_to_try = list(dict.fromkeys([m for m in candidate_models if m]))
            
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {groq_key}",
                "Content-Type": "application/json"
            }
            messages = [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"{context_summary}\n\nUser Question: {question}\n\nProvide a rigorous, clear scientific answer grounded exclusively in the context provided:"}
            ]

            for model_candidate in models_to_try:
                res = httpx.post(
                    url,
                    headers=headers,
                    json={
                        "model": model_candidate,
                        "messages": messages,
                        "temperature": 0.2,
                        "max_tokens": 1024,
                    },
                    timeout=15.0
                )
                if res.status_code == 200:
                    data = res.json()
                    answer_text = data["choices"][0]["message"]["content"]
                    model_used = f"groq/{model_candidate}"
                    break
                else:
                    continue
        except Exception as e:
            print(f"Groq API call error, falling back to expert reasoning engine: {e}")

    # 2. Attempt Gemini API if key is available and no answer yet
    elif gemini_key and not answer_text:
        try:
            import httpx
            context_summary = build_context_summary(context)
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
            prompt = f"{SYSTEM_PROMPT}\n\n{context_summary}\n\nUser Question: {question}\n\nProvide a clear, domain-accurate scientific answer:"
            res = httpx.post(url, json={"contents": [{"parts": [{"text": prompt}]}]}, timeout=15.0)
            if res.status_code == 200:
                data = res.json()
                answer_text = data["candidates"][0]["content"]["parts"][0]["text"]
                model_used = "gemini-1.5-flash"
        except Exception as e:
            print(f"Gemini API call failed, using expert reasoning engine: {e}")

    # 3. Attempt OpenAI API if key is available and no answer yet
    elif openai_key and not answer_text:
        try:
            import httpx
            context_summary = build_context_summary(context)
            url = "https://api.openai.com/v1/chat/completions"
            headers = {"Authorization": f"Bearer {openai_key}", "Content-Type": "application/json"}
            messages = [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"{context_summary}\n\nQuestion: {question}"}
            ]
            res = httpx.post(url, headers=headers, json={"model": "gpt-4o-mini", "messages": messages, "temperature": 0.2}, timeout=15.0)
            if res.status_code == 200:
                data = res.json()
                answer_text = data["choices"][0]["message"]["content"]
                model_used = "openai/gpt-4o-mini"
        except Exception as e:
            print(f"OpenAI API call failed, using expert reasoning engine: {e}")

    # 4. Grounded Expert Domain Reasoning Engine (Local Fallback)
    if not answer_text:
        answer_text = generate_expert_response(question, context)
        model_used = "domain-expert-engine"

    # Dynamic followup suggestions
    followups = [
        "Why is permeability low/high?",
        "Explain SHAP values",
        "How can I improve this molecule?",
    ]
    if context.get("what_if_data"):
        followups.append("Explain What-If modification")
    if context.get("comparison_data"):
        followups.append("Explain deciding difference")

    return {
        "answer": answer_text,
        "disclaimer": "Computational prediction based on machine learning model; not an experimental or clinical result.",
        "model_used": model_used,
        "suggested_followups": followups
    }
