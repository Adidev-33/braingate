import io
import datetime
from typing import Dict, Any, Optional, List

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image,
    KeepTogether,
    HRFlowable
)
from reportlab.pdfgen import canvas


class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas to calculate total page count and draw running header/footer."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count: int):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))

        # Running Top Rule & Title (pages > 1)
        if self._pageNumber > 1:
            self.drawString(36, 11 * inch - 30, "BrainGate — Blood-Brain Barrier Permeability Report")
            self.drawRightString(8.5 * inch - 36, 11 * inch - 30, f"Page {self._pageNumber} of {page_count}")
            self.setStrokeColor(colors.HexColor("#E2E8F0"))
            self.setLineWidth(0.75)
            self.line(36, 11 * inch - 34, 8.5 * inch - 36, 11 * inch - 34)

        # Running Footer (all pages)
        footer_text = "BrainGate AI • Early-stage computational screening estimate; not a substitute for in-vitro or clinical testing."
        self.drawString(36, 25, footer_text)
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(8.5 * inch - 36, 25, page_str)

        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.75)
        self.line(36, 36, 8.5 * inch - 36, 36)

        self.restoreState()


def render_shap_chart_image(shap_items: List[Dict[str, Any]], width_in: float = 6.8, height_in: float = 2.4) -> io.BytesIO:
    """Renders a high-resolution horizontal bar chart of SHAP values for the PDF."""
    # Reverse so top feature is at the top of the chart
    sorted_items = list(reversed(shap_items))
    names = [item.get("display_name", item.get("feature", "")) for item in sorted_items]
    values = [item.get("shap_value", 0.0) for item in sorted_items]

    fig, ax = plt.subplots(figsize=(width_in, height_in), dpi=200)
    fig.patch.set_facecolor('#FFFFFF')
    ax.set_facecolor('#F8FAFC')

    bar_colors = ['#059669' if val >= 0 else '#E11D48' for val in values]
    bars = ax.barh(range(len(names)), values, color=bar_colors, height=0.55, edgecolor='none', zorder=3)

    ax.axvline(0, color='#94A3B8', linestyle='--', linewidth=0.9, zorder=4)
    ax.grid(axis='x', color='#E2E8F0', linestyle=':', linewidth=0.8, zorder=0)

    ax.set_yticks(range(len(names)))
    ax.set_yticklabels(names, fontsize=8, fontweight='medium', color='#1E293B', fontfamily='sans-serif')
    ax.tick_params(axis='x', labelsize=8, colors='#64748B')
    ax.tick_params(axis='y', length=0)

    # Value labels beside bars
    for bar, val in zip(bars, values):
        width = bar.get_width()
        sign = "+" if val >= 0 else ""
        text_val = f"{sign}{val:.2f}"
        if val >= 0:
            ax.text(width + 0.015, bar.get_y() + bar.get_height() / 2, text_val,
                    va='center', ha='left', fontsize=7.5, fontweight='bold', color='#059669')
        else:
            ax.text(width - 0.015, bar.get_y() + bar.get_height() / 2, text_val,
                    va='center', ha='right', fontsize=7.5, fontweight='bold', color='#E11D48')

    # Extend x-limits slightly for text
    all_vals = values + [0]
    min_x, max_x = min(all_vals), max(all_vals)
    span = max_x - min_x
    padding = max(span * 0.18, 0.15)
    ax.set_xlim(min_x - padding, max_x + padding)

    ax.set_xlabel("SHAP Impact on BBB Permeability (Log-Odds Attribution)", fontsize=8, color='#475569', labelpad=4)
    
    # Hide top, right, and left spines
    for spine in ['top', 'right', 'left']:
        ax.spines[spine].set_visible(False)
    ax.spines['bottom'].set_color('#CBD5E1')

    plt.tight_layout(pad=0.5)
    
    img_buf = io.BytesIO()
    plt.savefig(img_buf, format='png', dpi=200, bbox_inches='tight', facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close(fig)
    img_buf.seek(0)
    return img_buf


def generate_pdf_report(smiles: str, scorecard: Dict[str, Any], molecule_name: Optional[str] = None) -> bytes:
    """
    Generates a print-ready, publication-grade PDF report using ReportLab.
    """
    pdf_buffer = io.BytesIO()

    # 36pt (0.5 in) margins for maximum printable area
    doc = SimpleDocTemplate(
        pdf_buffer,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=46
    )

    styles = getSampleStyleSheet()

    # Custom typography styles
    style_title = ParagraphStyle(
        'ReportTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0F172A')
    )
    style_subtitle = ParagraphStyle(
        'ReportSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#64748B')
    )
    style_section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#0F172A'),
        spaceBefore=8,
        spaceAfter=4
    )
    style_body = ParagraphStyle(
        'ReportBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor('#334155')
    )
    style_smiles = ParagraphStyle(
        'SmilesCode',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor('#0284C7')
    )
    style_badge_permeable = ParagraphStyle(
        'BadgePerm',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#065F46'),
        alignment=1
    )
    style_badge_non_permeable = ParagraphStyle(
        'BadgeNonPerm',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#991B1B'),
        alignment=1
    )
    style_th = ParagraphStyle(
        'TableHead',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor('#475569')
    )
    style_td = ParagraphStyle(
        'TableData',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor('#1E293B')
    )
    style_td_mono = ParagraphStyle(
        'TableDataMono',
        parent=styles['Normal'],
        fontName='Courier-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor('#0F172A')
    )

    story = []

    # Extraction of data fields from scorecard
    bbb_data = scorecard.get("bbb", {})
    tox_data = scorecard.get("toxicity", {})
    sol_data = scorecard.get("solubility", {})
    features = scorecard.get("features", {})
    verdict = scorecard.get("overall_verdict", "")

    is_permeable = bbb_data.get("prediction") == "permeable"
    confidence = bbb_data.get("confidence", 0.0)
    conf_pct = round(confidence * 100)
    perm_prob = bbb_data.get("permeable_probability", confidence)
    summary_sentence = bbb_data.get("summary_sentence", "")
    shap_items = bbb_data.get("shap_explanation", [])

    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")

    # -------------------------------------------------------------
    # 1. HEADER BANNER
    # -------------------------------------------------------------
    header_table_data = [
        [
            Paragraph("<b>BrainGate</b> — BBB Permeability Report", style_title),
            Paragraph(f"<b>Generated:</b> {now_str}", ParagraphStyle('RightMeta', parent=style_subtitle, alignment=2))
        ],
        [
            Paragraph(f"<b>Candidate:</b> {molecule_name or 'Unlabeled Molecule'} &nbsp;|&nbsp; <b>SMILES:</b> <font name='Courier' color='#0284C7'>{smiles}</font>", style_body),
            Paragraph("<b>Platform:</b> XGBoost + SHAP + RDKit", ParagraphStyle('RightMeta2', parent=style_subtitle, alignment=2))
        ]
    ]
    header_table = Table(header_table_data, colWidths=[5.0 * inch, 2.4 * inch])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0F172A'), spaceAfter=8))

    # -------------------------------------------------------------
    # 2. PRIMARY PREDICTION SUMMARY CARDS
    # -------------------------------------------------------------
    pred_label = "CROSSES BBB (Permeable)" if is_permeable else "DOES NOT CROSS BBB (Non-Permeable)"
    badge_style = style_badge_permeable if is_permeable else style_badge_non_permeable
    bg_badge_color = colors.HexColor('#D1FAE5') if is_permeable else colors.HexColor('#FEE2E2')
    border_badge_color = colors.HexColor('#10B981') if is_permeable else colors.HexColor('#EF4444')

    summary_box_data = [
        [
            Paragraph(f"<b>PREDICTION RESULT</b>", style_th),
            Paragraph("<b>CONFIDENCE SCORE</b>", style_th),
            Paragraph("<b>PERMEABLE PROBABILITY</b>", style_th),
            Paragraph("<b>MODEL VALIDATION</b>", style_th)
        ],
        [
            Paragraph(f"<b>{pred_label}</b>", badge_style),
            Paragraph(f"<font size=13><b>{conf_pct}%</b></font>", ParagraphStyle('C1', parent=style_td, fontName='Helvetica-Bold', alignment=1)),
            Paragraph(f"<font size=13><b>{perm_prob:.3f}</b></font>", ParagraphStyle('C2', parent=style_td, fontName='Helvetica-Bold', alignment=1)),
            Paragraph("<font size=9 color='#475569'>ROC-AUC: <b>0.8891</b><br/>Stratified BBBP</font>", ParagraphStyle('C3', parent=style_td, alignment=1))
        ]
    ]
    summary_box = Table(summary_box_data, colWidths=[2.8 * inch, 1.5 * inch, 1.6 * inch, 1.5 * inch])
    summary_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F1F5F9')),
        ('BACKGROUND', (0, 1), (0, 1), bg_badge_color),
        ('BACKGROUND', (1, 1), (-1, 1), colors.HexColor('#F8FAFC')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#CBD5E1')),
        ('BOX', (0, 1), (0, 1), 1.5, border_badge_color),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(summary_box)
    story.append(Spacer(1, 8))

    # -------------------------------------------------------------
    # 3. 7 RDKit DESCRIPTORS & CNS MPO GUIDELINE COMPARISON TABLE
    # -------------------------------------------------------------
    story.append(Paragraph("<b>1. Computed Physicochemical Descriptors vs CNS MPO Guidelines</b>", style_section_heading))
    
    tpsa = features.get("tpsa", 0.0)
    mw = features.get("mol_weight", 0.0)
    logp = features.get("logp", 0.0)
    hbd = features.get("h_donors", 0)
    hba = features.get("h_acceptors", 0)
    rotb = features.get("rotatable_bonds", 0)
    arom = features.get("aromatic_rings", 0)

    def get_status_badge(passed: bool) -> Paragraph:
        if passed:
            return Paragraph("<font color='#059669'><b>[PASS] Favorable</b></font>", style_td)
        return Paragraph("<font color='#E11D48'><b>[ALERT] Suboptimal</b></font>", style_td)

    desc_rows = [
        [
            Paragraph("Descriptor Name", style_th),
            Paragraph("Computed Value", style_th),
            Paragraph("CNS MPO Rule", style_th),
            Paragraph("Status", style_th),
            Paragraph("Pharmacological Impact & Role", style_th)
        ],
        [
            Paragraph("Topological Polar Surface Area (TPSA)", style_td),
            Paragraph(f"{tpsa:.2f} Å²", style_td_mono),
            Paragraph("< 90.0 Å²", style_td),
            get_status_badge(tpsa <= 90.0),
            Paragraph("Critical barrier to passive lipid diffusion; primary polar penalty.", style_td)
        ],
        [
            Paragraph("Molecular Weight (MW)", style_td),
            Paragraph(f"{mw:.2f} Da", style_td_mono),
            Paragraph("< 450.0 Da", style_td),
            get_status_badge(mw <= 450.0),
            Paragraph("Size constraint for transcellular capillary endothelial transit.", style_td)
        ],
        [
            Paragraph("Lipophilicity (cLogP)", style_td),
            Paragraph(f"{logp:.2f}", style_td_mono),
            Paragraph("1.0 – 4.0", style_td),
            get_status_badge(1.0 <= logp <= 4.0),
            Paragraph("Optimal octanol/water partition; avoids metabolic clearance.", style_td)
        ],
        [
            Paragraph("Hydrogen Bond Donors (HBD)", style_td),
            Paragraph(f"{hbd:.0f}", style_td_mono),
            Paragraph("≤ 3", style_td),
            get_status_badge(hbd <= 3),
            Paragraph("High donor count dramatically increases aqueous desolvation energy.", style_td)
        ],
        [
            Paragraph("Hydrogen Bond Acceptors (HBA)", style_td),
            Paragraph(f"{hba:.0f}", style_td_mono),
            Paragraph("≤ 7", style_td),
            get_status_badge(hba <= 7),
            Paragraph("Limits tight hydrogen-bonding with capillary tight-junction proteins.", style_td)
        ],
        [
            Paragraph("Rotatable Bonds", style_td),
            Paragraph(f"{rotb:.0f}", style_td_mono),
            Paragraph("≤ 8", style_td),
            get_status_badge(rotb <= 8),
            Paragraph("Low conformational entropy penalty during membrane insertion.", style_td)
        ],
        [
            Paragraph("Aromatic Rings", style_td),
            Paragraph(f"{arom:.0f}", style_td_mono),
            Paragraph("1 – 4", style_td),
            get_status_badge(1 <= arom <= 4),
            Paragraph("Aromatic π-stacking facilitates phospholipid bilayer partition.", style_td)
        ]
    ]

    desc_table = Table(desc_rows, colWidths=[2.2 * inch, 1.1 * inch, 1.0 * inch, 1.1 * inch, 2.0 * inch])
    desc_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F1F5F9')),
        ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#FFFFFF'), colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(desc_table)
    story.append(Spacer(1, 8))

    # -------------------------------------------------------------
    # 4. SHAP EXPLAINABILITY BREAKDOWN & BAR CHART
    # -------------------------------------------------------------
    story.append(Paragraph("<b>2. SHAP Feature Attribution & Explainability</b>", style_section_heading))
    
    # Rationale Callout Box
    rationale_text = f"<b>Chemical Rationale:</b> <i>\"{summary_sentence}\"</i>"
    rationale_box = Table(
        [[Paragraph(rationale_text, style_body)]],
        colWidths=[7.4 * inch]
    )
    rationale_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#EFF6FF')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#93C5FD')),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(rationale_box)
    story.append(Spacer(1, 4))

    # Embed static SHAP Chart
    if shap_items:
        chart_buf = render_shap_chart_image(shap_items, width_in=7.4, height_in=2.1)
        story.append(Image(chart_buf, width=7.4 * inch, height=2.1 * inch))
        story.append(Spacer(1, 8))

    # -------------------------------------------------------------
    # 5. MULTI-PROPERTY SCORECARD (Tox21 + ESOL)
    # -------------------------------------------------------------
    if tox_data and sol_data:
        story.append(Paragraph("<b>3. Pre-Clinical Multi-Property Candidate Scorecard</b>", style_section_heading))

        tox_pred = tox_data.get("prediction", "N/A")
        tox_conf = round(tox_data.get("confidence", 0.0) * 100)
        tox_prob = tox_data.get("toxic_probability", 0.0)
        tox_is_safe = tox_pred == "non_toxic"
        tox_badge = "<font color='#059669'><b>[LOW RISK] Non-Toxic</b></font>" if tox_is_safe else "<font color='#E11D48'><b>[ALERT] Toxic Liability</b></font>"

        sol_logs = sol_data.get("log_solubility", 0.0)
        sol_tier = sol_data.get("solubility_tier", "N/A")
        sol_desc = sol_data.get("tier_description", "")
        sol_badge = f"<font color='#0284C7'><b>{sol_tier} Solubility</b></font> ({sol_logs:.2f} log mol/L)"

        multi_rows = [
            [
                Paragraph("Assay / Target", style_th),
                Paragraph("Prediction Verdict", style_th),
                Paragraph("Confidence / Metric", style_th),
                Paragraph("Biological Interpretation", style_th)
            ],
            [
                Paragraph("<b>Tox21 Stress & Receptor Risk</b>", style_td),
                Paragraph(tox_badge, style_td),
                Paragraph(f"{tox_conf}% conf (P_tox: {tox_prob:.2f})", style_td_mono),
                Paragraph("Screen across 12 nuclear receptor and cellular stress pathways.", style_td)
            ],
            [
                Paragraph("<b>ESOL Delaney Aqueous Solubility</b>", style_td),
                Paragraph(sol_badge, style_td),
                Paragraph(f"{sol_logs:.2f} log(mol/L)", style_td_mono),
                Paragraph(sol_desc or "Thermodynamic aqueous solubility estimate.", style_td)
            ]
        ]
        multi_table = Table(multi_rows, colWidths=[2.2 * inch, 1.8 * inch, 1.4 * inch, 2.0 * inch])
        multi_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F1F5F9')),
            ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor('#CBD5E1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#FFFFFF'), colors.HexColor('#F8FAFC')]),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        story.append(multi_table)
        story.append(Spacer(1, 6))

        # Overall Verdict Banner
        if verdict:
            verdict_table = Table(
                [[Paragraph(f"<b>Overall Candidate Verdict:</b> {verdict}", style_body)]],
                colWidths=[7.4 * inch]
            )
            verdict_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
                ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#CBD5E1')),
                ('LEFTPADDING', (0, 0), (-1, -1), 8),
                ('RIGHTPADDING', (0, 0), (-1, -1), 8),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ]))
            story.append(verdict_table)

    # Build the document with running header and footer canvas
    doc.build(story, canvasmaker=NumberedCanvas)

    pdf_bytes = pdf_buffer.getvalue()
    pdf_buffer.close()
    return pdf_bytes
