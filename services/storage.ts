/**
 * Local Storage Service for PDFs and User Preferences
 * Uses expo-file-system for file operations
 */

import * as FileSystem from 'expo-file-system/legacy';


// Directory for storing PDFs locally on device
const PDF_DIRECTORY = `${FileSystem.documentDirectory}pdfs/`;
const PREFERENCES_FILE = `${FileSystem.documentDirectory}preferences.json`;

export interface StoredPDF {
    id: string;
    filename: string;
    title: string;
    subject: string;
    grade: string;
    createdAt: string;
    filePath: string;   // REQUIRED
    fileSize: number;   // REQUIRED
}


export interface UserPreferences {
    lastSubject?: 'math' | 'science';
    lastGrade?: string;
    includeAnswers?: boolean;
    recentPrompts?: string[];
}

class StorageService {
    private initialized: boolean = false;

    /**
     * Initialize storage directories
     */
    async init(): Promise<void> {
        if (this.initialized) return;

        try {
            const dirInfo = await FileSystem.getInfoAsync(PDF_DIRECTORY);
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(PDF_DIRECTORY, { intermediates: true });
            }
            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize storage:', error);
            throw error;
        }
    }

    /**
     * Save a PDF from base64 data
     */
    async savePDF(
        pdfBase64: string,
        metadata: Omit<StoredPDF, 'filePath' | 'fileSize'>
    ): Promise<StoredPDF> {
        await this.init();

        // Sanitize filename to replace spaces with underscores to avoid path issues
        const safeFilename = metadata.filename.replace(/\s+/g, '_');
        const filePath = `${PDF_DIRECTORY}${safeFilename}`;

        try {
            await FileSystem.writeAsStringAsync(filePath, pdfBase64, {
                encoding: FileSystem.EncodingType.Base64,
            });

            const fileInfo = await FileSystem.getInfoAsync(filePath);
            const fileSize = (fileInfo as any).size || 0;

            const storedPDF: StoredPDF = {
                ...metadata,
                filePath,
                fileSize,
            };

            // Update the PDF index
            await this.updatePDFIndex(storedPDF);

            return storedPDF;
        } catch (error) {
            console.error('Failed to save PDF:', error);
            throw error;
        }
    }

    /**
     * Get all stored PDFs
     */
    async getAllPDFs(): Promise<StoredPDF[]> {
        await this.init();

        try {
            const indexPath = `${PDF_DIRECTORY}index.json`;
            const indexInfo = await FileSystem.getInfoAsync(indexPath);

            if (!indexInfo.exists) {
                return [];
            }

            const indexContent = await FileSystem.readAsStringAsync(indexPath);
            return JSON.parse(indexContent);
        } catch (error) {
            console.error('Failed to get PDFs:', error);
            return [];
        }
    }

    /**
     * Get a specific PDF
     */
    async getPDF(id: string): Promise<StoredPDF | null> {
        const pdfs = await this.getAllPDFs();
        return pdfs.find((pdf) => pdf.id === id) || null;
    }

    /**
     * Get PDF file content as base64
     */
    async getPDFContent(filePath: string): Promise<string> {
        try {
            return await FileSystem.readAsStringAsync(filePath, {
                encoding: FileSystem.EncodingType.Base64,
            });
        } catch (error) {
            console.error('Failed to read PDF content:', error);
            throw error;
        }
    }

    /**
     * Delete a PDF
     */
    async deletePDF(id: string): Promise<void> {
        await this.init();

        try {
            const pdfs = await this.getAllPDFs();
            const pdfToDelete = pdfs.find((pdf) => pdf.id === id);

            if (pdfToDelete) {
                // Delete the file
                await FileSystem.deleteAsync(pdfToDelete.filePath, { idempotent: true });

                // Update index
                const updatedPDFs = pdfs.filter((pdf) => pdf.id !== id);
                await this.savePDFIndex(updatedPDFs);
            }
        } catch (error) {
            console.error('Failed to delete PDF:', error);
            throw error;
        }
    }

    /**
     * Update the PDF index with a new entry
     */
    private async updatePDFIndex(pdf: StoredPDF): Promise<void> {
        const pdfs = await this.getAllPDFs();
        const existingIndex = pdfs.findIndex((p) => p.id === pdf.id);

        if (existingIndex >= 0) {
            pdfs[existingIndex] = pdf;
        } else {
            pdfs.unshift(pdf); // Add to beginning (most recent first)
        }

        await this.savePDFIndex(pdfs);
    }

    /**
     * Save the PDF index
     */
    private async savePDFIndex(pdfs: StoredPDF[]): Promise<void> {
        const indexPath = `${PDF_DIRECTORY}index.json`;
        await FileSystem.writeAsStringAsync(indexPath, JSON.stringify(pdfs, null, 2));
    }

    /**
     * Get user preferences
     */
    async getPreferences(): Promise<UserPreferences> {
        try {
            const fileInfo = await FileSystem.getInfoAsync(PREFERENCES_FILE);

            if (!fileInfo.exists) {
                return {};
            }

            const content = await FileSystem.readAsStringAsync(PREFERENCES_FILE);
            return JSON.parse(content);
        } catch (error) {
            console.error('Failed to get preferences:', error);
            return {};
        }
    }

    /**
     * Save user preferences
     */
    async savePreferences(prefs: Partial<UserPreferences>): Promise<void> {
        try {
            const existing = await this.getPreferences();
            const updated = { ...existing, ...prefs };

            // Keep only last 10 recent prompts
            if (updated.recentPrompts && updated.recentPrompts.length > 10) {
                updated.recentPrompts = updated.recentPrompts.slice(0, 10);
            }

            await FileSystem.writeAsStringAsync(
                PREFERENCES_FILE,
                JSON.stringify(updated, null, 2)
            );
        } catch (error) {
            console.error('Failed to save preferences:', error);
            throw error;
        }
    }

    /**
     * Add a recent prompt
     */
    async addRecentPrompt(prompt: string): Promise<void> {
        const prefs = await this.getPreferences();
        const prompts = prefs.recentPrompts || [];

        // Remove if already exists (to move to front)
        const filtered = prompts.filter((p) => p !== prompt);
        filtered.unshift(prompt);

        await this.savePreferences({ recentPrompts: filtered.slice(0, 10) });
    }

    /**
     * Clear all stored data
     */
    async clearAll(): Promise<void> {
        try {
            await FileSystem.deleteAsync(PDF_DIRECTORY, { idempotent: true });
            await FileSystem.deleteAsync(PREFERENCES_FILE, { idempotent: true });
            this.initialized = false;
        } catch (error) {
            console.error('Failed to clear storage:', error);
            throw error;
        }
    }

    /**
     * Get storage usage info
     */
    async getStorageInfo(): Promise<{ pdfCount: number; totalSize: number }> {
        const pdfs = await this.getAllPDFs();
        const totalSize = pdfs.reduce((sum, pdf) => sum + pdf.fileSize, 0);

        return {
            pdfCount: pdfs.length,
            totalSize,
        };
    }
}

// Export singleton instance
export const storageService = new StorageService();

// Export class for testing
export { StorageService };

