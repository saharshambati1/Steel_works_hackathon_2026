"""
MeshMind Backend - FastAPI Server
Educational PDF Generator with RAG-augmented content generation.
"""
import os
import uuid
import base64
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from dotenv import load_dotenv

from groq_client import generate_educational_content
from rag_engine import get_augmented_context
from pdf_generator import generate_pdf, save_pdf

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="MeshMind API",
    description="Educational PDF Generator with AI-powered content creation",
    version="1.0.0"
)

# Configure CORS for React Native
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directory for storing generated PDFs
PDF_STORAGE_DIR = os.path.join(os.path.dirname(__file__), "generated_pdfs")
os.makedirs(PDF_STORAGE_DIR, exist_ok=True)


# ============ Request/Response Models ============

class GeneratePDFRequest(BaseModel):
    prompt: str
    subject: str  # "math" or "science"
    grade: str  # e.g., "4", "K", "Algebra 1"
    include_answers: bool = True


class GeneratePDFResponse(BaseModel):
    success: bool
    pdf_id: str
    filename: str
    title: str
    subject: str
    grade: str
    created_at: str
    pdf_base64: Optional[str] = None  # Base64 encoded PDF for direct download
    message: str


class PDFMetadata(BaseModel):
    pdf_id: str
    filename: str
    title: str
    subject: str
    grade: str
    created_at: str
    file_size_bytes: int


class CurriculumInfo(BaseModel):
    subject: str
    grade: str
    overview: str
    topics: list


# ============ API Endpoints ============

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "service": "MeshMind API",
        "status": "healthy",
        "version": "1.0.0"
    }


@app.get("/api/health")
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "groq_api_configured": bool(os.getenv("GROQ_API_KEY")),
        "pdf_storage_dir": PDF_STORAGE_DIR,
        "timestamp": datetime.now().isoformat()
    }


@app.post("/api/generate-pdf", response_model=GeneratePDFResponse)
async def generate_pdf_endpoint(request: GeneratePDFRequest):
    """
    Generate an educational PDF based on user prompt.
    
    1. Retrieve curriculum context via RAG
    2. Generate content using Groq LLM
    3. Convert to PDF
    4. Store locally and return
    """
    try:
        # Validate subject
        if request.subject.lower() not in ["math", "science"]:
            raise HTTPException(
                status_code=400, 
                detail="Subject must be 'math' or 'science'"
            )
        
        # Step 1: Get RAG context
        curriculum_context = get_augmented_context(
            prompt=request.prompt,
            subject=request.subject.lower(),
            grade=request.grade
        )
        
        # Step 2: Generate content with Groq
        content = generate_educational_content(
            prompt=request.prompt,
            subject=request.subject.lower(),
            grade=request.grade,
            curriculum_context=curriculum_context
        )
        
        # Check for errors
        if "error" in content and content.get("explanation", "").startswith("Failed"):
            raise HTTPException(
                status_code=500,
                detail=f"Content generation failed: {content.get('error')}"
            )
        
        # Step 3: Generate PDF
        pdf_bytes = generate_pdf(
            content=content,
            subject=request.subject,
            grade=request.grade,
            include_answers=request.include_answers
        )
        
        # Step 4: Save PDF locally
        pdf_id = str(uuid.uuid4())[:8]
        title = content.get("title", f"{request.subject.title()} Worksheet")
        safe_title = "".join(c for c in title if c.isalnum() or c in (' ', '-', '_')).strip()
        filename = f"{safe_title}_{pdf_id}.pdf"
        
        filepath = save_pdf(pdf_bytes, filename, PDF_STORAGE_DIR)
        
        # Encode PDF to base64 for direct transfer
        pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
        
        return GeneratePDFResponse(
            success=True,
            pdf_id=pdf_id,
            filename=filename,
            title=title,
            subject=request.subject,
            grade=request.grade,
            created_at=datetime.now().isoformat(),
            pdf_base64=pdf_base64,
            message="PDF generated successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"PDF generation failed: {str(e)}"
        )


@app.get("/api/pdfs")
async def list_pdfs():
    """List all generated PDFs in storage."""
    pdfs = []
    
    for filename in os.listdir(PDF_STORAGE_DIR):
        if filename.endswith('.pdf'):
            filepath = os.path.join(PDF_STORAGE_DIR, filename)
            stat = os.stat(filepath)
            
            # Extract info from filename (format: Title_id.pdf)
            parts = filename.rsplit('_', 1)
            title = parts[0] if len(parts) > 1 else filename
            pdf_id = parts[1].replace('.pdf', '') if len(parts) > 1 else filename
            
            pdfs.append({
                "pdf_id": pdf_id,
                "filename": filename,
                "title": title,
                "file_size_bytes": stat.st_size,
                "created_at": datetime.fromtimestamp(stat.st_mtime).isoformat()
            })
    
    return {"pdfs": pdfs, "count": len(pdfs)}


@app.get("/api/pdfs/{pdf_id}")
async def get_pdf(pdf_id: str):
    """Get a specific PDF by ID."""
    for filename in os.listdir(PDF_STORAGE_DIR):
        if pdf_id in filename and filename.endswith('.pdf'):
            filepath = os.path.join(PDF_STORAGE_DIR, filename)
            
            with open(filepath, 'rb') as f:
                pdf_bytes = f.read()
            
            return Response(
                content=pdf_bytes,
                media_type="application/pdf",
                headers={"Content-Disposition": f"attachment; filename={filename}"}
            )
    
    raise HTTPException(status_code=404, detail="PDF not found")


@app.get("/api/pdfs/{pdf_id}/base64")
async def get_pdf_base64(pdf_id: str):
    """Get a PDF as base64 encoded string (for mobile transfer)."""
    for filename in os.listdir(PDF_STORAGE_DIR):
        if pdf_id in filename and filename.endswith('.pdf'):
            filepath = os.path.join(PDF_STORAGE_DIR, filename)
            
            with open(filepath, 'rb') as f:
                pdf_bytes = f.read()
            
            return {
                "pdf_id": pdf_id,
                "filename": filename,
                "pdf_base64": base64.b64encode(pdf_bytes).decode('utf-8'),
                "file_size_bytes": len(pdf_bytes)
            }
    
    raise HTTPException(status_code=404, detail="PDF not found")


@app.delete("/api/pdfs/{pdf_id}")
async def delete_pdf(pdf_id: str):
    """Delete a PDF by ID."""
    for filename in os.listdir(PDF_STORAGE_DIR):
        if pdf_id in filename and filename.endswith('.pdf'):
            filepath = os.path.join(PDF_STORAGE_DIR, filename)
            os.remove(filepath)
            return {"success": True, "message": f"PDF {pdf_id} deleted"}
    
    raise HTTPException(status_code=404, detail="PDF not found")


@app.get("/api/curriculum/{subject}/{grade}")
async def get_curriculum(subject: str, grade: str):
    """Get curriculum information for a subject and grade."""
    context = get_augmented_context("", subject.lower(), grade)
    
    if not context:
        raise HTTPException(
            status_code=404,
            detail=f"Curriculum not found for {subject} grade {grade}"
        )
    
    return {
        "subject": subject,
        "grade": grade,
        "context": context
    }


# ============ Run Server ============

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
