/**
 * DevDraft AI - ZIP Generator
 * 
 * Creates downloadable ZIP files from generated project files.
 */

import JSZip from 'jszip';

/**
 * Creates a ZIP file from generated project files and triggers download.
 */
export const downloadProjectAsZip = async (projectName, files) => {
    const zip = new JSZip();

    // Add each file to the ZIP
    files.forEach(file => {
        // Handle nested paths (e.g., "src/components/Button.jsx")
        zip.file(file.path, file.content);
    });

    // Generate the ZIP blob
    const blob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 }
    });

    // Trigger download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

/**
 * Copies a single file's content to clipboard.
 */
export const copyFileToClipboard = async (content) => {
    try {
        await navigator.clipboard.writeText(content);
        return true;
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        return false;
    }
};
