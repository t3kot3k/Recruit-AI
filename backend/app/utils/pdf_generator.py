import io
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from app.schemas.cv import OptimizedCV


# Template color schemes
TEMPLATES = {
    "minimalist": {
        "primary": "#333333",
        "secondary": "#666666",
        "accent": "#000000",
        "name_size": 20,
        "heading_size": 12,
        "body_size": 10,
    },
    "executive": {
        "primary": "#1a365d",
        "secondary": "#4a5568",
        "accent": "#2b6cb0",
        "name_size": 22,
        "heading_size": 13,
        "body_size": 10,
    },
    "classic": {
        "primary": "#2d3748",
        "secondary": "#718096",
        "accent": "#2b6cb0",
        "name_size": 20,
        "heading_size": 12,
        "body_size": 10,
    },
}


def generate_cv_pdf(cv: OptimizedCV, template: str = "classic") -> bytes:
    """
    Generate an ATS-friendly PDF from optimized CV data.

    Uses reportlab for text-based rendering (no HTML parsing, no images)
    to ensure maximum ATS compatibility.

    Args:
        cv: The optimized CV data.
        template: Template style name (minimalist, executive, classic).

    Returns:
        PDF file content as bytes.
    """
    t = TEMPLATES.get(template, TEMPLATES["classic"])
    buffer = io.BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    name_style = ParagraphStyle(
        "CVName",
        parent=styles["Normal"],
        fontSize=t["name_size"],
        textColor=HexColor(t["primary"]),
        alignment=TA_CENTER,
        spaceAfter=4,
        fontName="Helvetica-Bold",
    )

    contact_style = ParagraphStyle(
        "CVContact",
        parent=styles["Normal"],
        fontSize=9,
        textColor=HexColor(t["secondary"]),
        alignment=TA_CENTER,
        spaceAfter=8,
    )

    heading_style = ParagraphStyle(
        "CVHeading",
        parent=styles["Normal"],
        fontSize=t["heading_size"],
        textColor=HexColor(t["accent"]),
        spaceBefore=12,
        spaceAfter=4,
        fontName="Helvetica-Bold",
    )

    body_style = ParagraphStyle(
        "CVBody",
        parent=styles["Normal"],
        fontSize=t["body_size"],
        textColor=HexColor(t["primary"]),
        spaceAfter=2,
        leading=14,
    )

    sub_heading_style = ParagraphStyle(
        "CVSubHeading",
        parent=styles["Normal"],
        fontSize=t["body_size"] + 1,
        textColor=HexColor(t["primary"]),
        fontName="Helvetica-Bold",
        spaceAfter=1,
    )

    detail_style = ParagraphStyle(
        "CVDetail",
        parent=styles["Normal"],
        fontSize=t["body_size"] - 1,
        textColor=HexColor(t["secondary"]),
        spaceAfter=2,
    )

    bullet_style = ParagraphStyle(
        "CVBullet",
        parent=styles["Normal"],
        fontSize=t["body_size"],
        textColor=HexColor(t["primary"]),
        leftIndent=12,
        spaceAfter=2,
        leading=13,
        bulletIndent=0,
    )

    elements = []

    # --- Contact ---
    if cv.contact_name:
        elements.append(Paragraph(cv.contact_name, name_style))

    contact_parts = [
        p for p in [cv.contact_email, cv.contact_phone, cv.contact_location]
        if p
    ]
    if contact_parts:
        elements.append(Paragraph(" | ".join(contact_parts), contact_style))
    if cv.contact_linkedin:
        elements.append(Paragraph(cv.contact_linkedin, contact_style))

    elements.append(HRFlowable(
        width="100%", thickness=0.5,
        color=HexColor(t["secondary"]),
        spaceAfter=6, spaceBefore=6,
    ))

    # --- Summary ---
    if cv.summary:
        elements.append(Paragraph("PROFESSIONAL SUMMARY", heading_style))
        elements.append(Paragraph(cv.summary, body_style))

    # --- Experience ---
    if cv.experience:
        elements.append(Paragraph("EXPERIENCE", heading_style))
        elements.append(HRFlowable(
            width="100%", thickness=0.3,
            color=HexColor(t["secondary"]),
            spaceAfter=4,
        ))
        for exp in cv.experience:
            title_line = exp.title
            if exp.organization:
                title_line += f" — {exp.organization}"
            elements.append(Paragraph(title_line, sub_heading_style))
            if exp.period:
                elements.append(Paragraph(exp.period, detail_style))
            for bullet in (exp.bullets or []):
                elements.append(Paragraph(f"• {bullet}", bullet_style))
            elements.append(Spacer(1, 4))

    # --- Education ---
    if cv.education:
        elements.append(Paragraph("EDUCATION", heading_style))
        elements.append(HRFlowable(
            width="100%", thickness=0.3,
            color=HexColor(t["secondary"]),
            spaceAfter=4,
        ))
        for edu in cv.education:
            title_line = edu.title
            if edu.organization:
                title_line += f" — {edu.organization}"
            elements.append(Paragraph(title_line, sub_heading_style))
            if edu.period:
                elements.append(Paragraph(edu.period, detail_style))
            if edu.details:
                elements.append(Paragraph(edu.details, body_style))
            elements.append(Spacer(1, 4))

    # --- Skills ---
    if cv.skills:
        elements.append(Paragraph("SKILLS", heading_style))
        elements.append(HRFlowable(
            width="100%", thickness=0.3,
            color=HexColor(t["secondary"]),
            spaceAfter=4,
        ))
        elements.append(Paragraph(
            " • ".join(cv.skills),
            body_style,
        ))

    # --- Certifications ---
    if cv.certifications:
        elements.append(Paragraph("CERTIFICATIONS", heading_style))
        elements.append(HRFlowable(
            width="100%", thickness=0.3,
            color=HexColor(t["secondary"]),
            spaceAfter=4,
        ))
        for cert in cv.certifications:
            elements.append(Paragraph(f"• {cert}", bullet_style))

    doc.build(elements)
    return buffer.getvalue()
