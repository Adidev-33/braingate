# Changelog

All notable changes to the BrainGate project will be documented in this file.

## [Unreleased]

### Added
- Completed Phase 3 Frontend Next.js conversion from Google Stitch visual design export (`stitch_braingate_bbb_predictor/`).
- Built `frontend/components/Header.tsx`: Top navigation header with status indicators and user lab profile.
- Built `frontend/components/SmilesInput.tsx`: SMILES terminal input card with copy/clear buttons, character counter, RDKit validation badge, and parameter preview bar.
- Built `frontend/components/ExampleMoleculePicker.tsx`: 2x2 grid of reference control benchmark cards (Caffeine, Diazepam, Atenolol, Dopamine) fetched live from `/examples`.
- Built `frontend/components/PredictionCard.tsx`: Endothelial transport filter card rendering prediction label (`Crosses BBB` / `Does Not Cross BBB`), circular SVG confidence gauge, and Executive Chemical Rationale text block.
- Built `frontend/components/ShapBarChart.tsx`: Rebuilt live with Recharts displaying horizontal bars centered around baseline 0 (`+ Favors Crossing` in cyan/emerald, `- Restricts Crossing` in red/rose) and plain-language chemist explanations.
- Built `frontend/components/FeaturesTable.tsx`: Table comparing 7 computed descriptors against CNS MPO guidelines (`TPSA < 90 Å²`, `MW < 450 Da`, `LogP 1–4`).
- Built `frontend/components/InvalidSmilesBanner.tsx`: Red syntax error banner for malformed SMILES strings (`INFERENCE BLOCKED • SYNTAX MALFORMED`).
- Built `frontend/components/ComparisonView.tsx`: Side-by-side comparative analysis mode calling `/compare`.
- Verified end-to-end loop live at `http://localhost:3000`.
