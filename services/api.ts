/**
 * API Service for MeshMind Backend
 * Handles all communication with the FastAPI server
 */

//Use your computer's local IP for device testing, localhost for emulator
//const API_BASE_URL = 'http://10.0.2.2:8000'; // Android emulator
// const API_BASE_URL = 'http://localhost:8000'; // iOS simulator
const API_BASE_URL = 'http://192.168.1.27:8000'; // Physical device

export interface GeneratePDFRequest {
    prompt: string;
    subject: 'math' | 'science';
    grade: string;
    language: 'English' | 'Spanish';
    include_answers?: boolean;
}

export interface GeneratePDFResponse {
    success: boolean;
    pdf_id: string;
    filename: string;
    title: string;
    subject: string;
    grade: string;
    created_at: string;
    pdf_base64?: string;
    message: string;
}

export interface PDFItem {
    pdf_id: string;
    filename: string;
    title: string;
    file_size_bytes: number;
    created_at: string;
}

export interface ListPDFsResponse {
    pdfs: PDFItem[];
    count: number;
}

class ApiService {
    private baseUrl: string;

    constructor(baseUrl: string = API_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    /**
     * Check if the backend is reachable
     */
    async healthCheck(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/api/health`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            return response.ok;
        } catch (error) {
            console.error('Health check failed:', error);
            return false;
        }
    }

    /**
     * Generate a new educational PDF
     */
    async generatePDF(request: GeneratePDFRequest): Promise<GeneratePDFResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/api/generate-pdf`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: request.prompt,
                    subject: request.subject,
                    grade: request.grade,
                    language: request.language,
                    include_answers: request.include_answers ?? true,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'PDF generation failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Generate PDF error:', error);
            throw error;
        }
    }

    /**
     * List all generated PDFs
     */
    async listPDFs(): Promise<ListPDFsResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/api/pdfs`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch PDFs');
            }

            return await response.json();
        } catch (error) {
            console.error('List PDFs error:', error);
            throw error;
        }
    }

    /**
     * Get a specific PDF as base64
     */
    async getPDFBase64(pdfId: string): Promise<{ pdf_base64: string; filename: string }> {
        try {
            const response = await fetch(`${this.baseUrl}/api/pdfs/${pdfId}/base64`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch PDF');
            }

            return await response.json();
        } catch (error) {
            console.error('Get PDF error:', error);
            throw error;
        }
    }

    /**
     * Delete a PDF
     */
    async deletePDF(pdfId: string): Promise<void> {
        try {
            const response = await fetch(`${this.baseUrl}/api/pdfs/${pdfId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                throw new Error('Failed to delete PDF');
            }
        } catch (error) {
            console.error('Delete PDF error:', error);
            throw error;
        }
    }

    /**
     * Get curriculum information
     */
    async getCurriculum(subject: string, grade: string): Promise<{ context: string }> {
        try {
            const response = await fetch(
                `${this.baseUrl}/api/curriculum/${subject}/${grade}`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch curriculum');
            }

            return await response.json();
        } catch (error) {
            console.error('Get curriculum error:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const apiService = new ApiService();

// Export class for custom instances
export { ApiService };

