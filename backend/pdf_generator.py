"""
PDF Generator for Educational Content
Converts structured educational content into professional PDFs.
"""
import io
import os
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT


# Color scheme
PRIMARY_COLOR = HexColor('#2563EB')  # Blue
SECONDARY_COLOR = HexColor('#10B981')  # Green
TEXT_COLOR = HexColor('#1F2937')  # Dark gray
LIGHT_BG = HexColor('#F3F4F6')  # Light gray background


def create_styles():
    """Create custom paragraph styles for the PDF without conflicting with ReportLab defaults."""
    base_styles = getSampleStyleSheet()
    styles = {}

    # Title style
    styles['PDFTitle'] = ParagraphStyle(
        name='PDFTitle',
        parent=base_styles['Heading1'],
        fontSize=24,
        textColor=PRIMARY_COLOR,
        spaceAfter=20,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )

    # Section header style
    styles['SectionHeader'] = ParagraphStyle(
        name='SectionHeader',
        parent=base_styles['Heading2'],
        fontSize=16,
        textColor=PRIMARY_COLOR,
        spaceBefore=20,
        spaceAfter=10,
        fontName='Helvetica-Bold'
    )

    # Subsection style
    styles['Subsection'] = ParagraphStyle(
        name='Subsection',
        parent=base_styles['Heading3'],
        fontSize=12,
        textColor=SECONDARY_COLOR,
        spaceBefore=10,
        spaceAfter=5,
        fontName='Helvetica-Bold'
    )

    # Custom body text style (renamed from BodyText → CustomBodyText)
    styles['CustomBodyText'] = ParagraphStyle(
        name='CustomBodyText',
        parent=base_styles['Normal'],
        fontSize=11,
        textColor=TEXT_COLOR,
        spaceAfter=8,
        leading=16,
        fontName='Helvetica'
    )

    # Question style
    styles['Question'] = ParagraphStyle(
        name='Question',
        parent=base_styles['Normal'],
        fontSize=11,
        textColor=TEXT_COLOR,
        spaceBefore=8,
        spaceAfter=4,
        leftIndent=20,
        fontName='Helvetica'
    )

    # Answer style
    styles['Answer'] = ParagraphStyle(
        name='Answer',
        parent=base_styles['Normal'],
        fontSize=10,
        textColor=HexColor('#6B7280'),
        leftIndent=40,
        fontName='Helvetica-Oblique'
    )

    # Difficulty badge style
    styles['DifficultyBadge'] = ParagraphStyle(
        name='DifficultyBadge',
        parent=base_styles['Normal'],
        fontSize=9,
        textColor=SECONDARY_COLOR,
        fontName='Helvetica-Bold'
    )

    return styles



def generate_pdf(content: dict, subject: str, grade: str, include_answers: bool = True) -> bytes:
    """
    Generate a PDF from structured educational content.
    
    Args:
        content: Dict with title, explanation, worked_examples, practice_questions, answer_key
        subject: "math" or "science"
        grade: Grade level
        include_answers: Whether to include the answer key
    
    Returns:
        PDF file as bytes
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=0.75*inch,
        leftMargin=0.75*inch,
        topMargin=0.75*inch,
        bottomMargin=0.75*inch
    )
    
    styles = create_styles()
    elements = []
    
    # Title
    title = content.get('title', f'{subject.title()} Worksheet - Grade {grade}')
    elements.append(Paragraph(title, styles['PDFTitle']))
    
    # Metadata line
    date_str = datetime.now().strftime("%B %d, %Y")
    meta_text = f"<font color='#6B7280'>Subject: {subject.title()} | Grade: {grade} | Generated: {date_str}</font>"
    elements.append(Paragraph(meta_text, styles['CustomBodyText']))
    elements.append(Spacer(1, 20))
    
    # Explanation section
    if content.get('explanation'):
        elements.append(Paragraph("📖 Concept Explanation", styles['SectionHeader']))
        # Split explanation into paragraphs
        explanation = content['explanation']
        for para in explanation.split('\n\n'):
            if para.strip():
                elements.append(Paragraph(para.strip(), styles['CustomBodyText']))
        elements.append(Spacer(1, 15))
    
    # Worked Examples section
    if content.get('worked_examples'):
        elements.append(Paragraph("✏️ Worked Examples", styles['SectionHeader']))
        for i, example in enumerate(content['worked_examples'], 1):
            elements.append(Paragraph(f"Example {i}", styles['Subsection']))
            
            problem = example.get('problem', '')
            elements.append(Paragraph(f"<b>Problem:</b> {problem}", styles['CustomBodyText']))
            
            solution = example.get('solution', '')
            # Format solution with line breaks
            solution_formatted = solution.replace('\n', '<br/>')
            elements.append(Paragraph(f"<b>Solution:</b><br/>{solution_formatted}", styles['CustomBodyText']))
            elements.append(Spacer(1, 10))
        elements.append(Spacer(1, 15))
    
    # Practice Questions section
    if content.get('practice_questions'):
        elements.append(Paragraph("📝 Practice Questions", styles['SectionHeader']))
        for i, q in enumerate(content['practice_questions'], 1):
            question = q.get('question', '')
            difficulty = q.get('difficulty', 'medium')
            
            # Difficulty badge
            difficulty_colors = {
                'easy': '#10B981',
                'medium': '#F59E0B',
                'hard': '#EF4444'
            }
            diff_color = difficulty_colors.get(difficulty.lower(), '#6B7280')
            
            question_text = f"<b>{i}.</b> {question} <font color='{diff_color}'>[{difficulty.upper()}]</font>"
            elements.append(Paragraph(question_text, styles['Question']))
            
            # Add space for student work
            elements.append(Spacer(1, 30))
        elements.append(Spacer(1, 20))
    
    # Answer Key section (optional, on new page)
    if include_answers and content.get('answer_key'):
        elements.append(PageBreak())
        elements.append(Paragraph("🔑 Answer Key", styles['SectionHeader']))
        elements.append(Paragraph("<i>For teacher/tutor reference</i>", styles['Answer']))
        elements.append(Spacer(1, 10))
        
        for i, answer in enumerate(content['answer_key'], 1):
            elements.append(Paragraph(f"<b>{i}.</b> {answer}", styles['CustomBodyText']))
    
    # Build PDF
    doc.build(elements)
    
    # Get bytes
    pdf_bytes = buffer.getvalue()
    buffer.close()
    
    return pdf_bytes


def save_pdf(pdf_bytes: bytes, filename: str, output_dir: str = None) -> str:
    """
    Save PDF bytes to a file.
    
    Args:
        pdf_bytes: PDF content as bytes
        filename: Name for the PDF file
        output_dir: Directory to save to (defaults to ./generated_pdfs)
    
    Returns:
        Full path to saved file
    """
    if output_dir is None:
        output_dir = os.path.join(os.path.dirname(__file__), "generated_pdfs")
    
    os.makedirs(output_dir, exist_ok=True)
    
    # Ensure .pdf extension
    if not filename.endswith('.pdf'):
        filename += '.pdf'
    
    filepath = os.path.join(output_dir, filename)
    
    with open(filepath, 'wb') as f:
        f.write(pdf_bytes)
    
    return filepath
