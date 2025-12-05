import * as RNFS from 'react-native-fs';

/**
 * Extract text from PDF file using improved method
 */
export async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    console.log('Attempting to extract text from PDF:', filePath);
    
    // Read PDF file as base64 first
    const pdfData = await RNFS.readFile(filePath, 'base64');
    
    // Convert to binary string for parsing
    let pdfString = '';
    try {
      const buffer = Buffer.from(pdfData, 'base64');
      pdfString = buffer.toString('binary');
    } catch (bufferError) {
      // Fallback: decode base64 manually
      const binaryString = atob(pdfData);
      pdfString = binaryString;
    }
    
    console.log(`PDF file size: ${pdfString.length} bytes`);
    
    let extractedText = '';
    const textParts: string[] = [];
    
    // Method 1: Extract text between BT (Begin Text) and ET (End Text) operators
    const textBlocks = pdfString.match(/BT([\s\S]*?)ET/g);
    if (textBlocks && textBlocks.length > 0) {
      console.log(`Found ${textBlocks.length} text blocks`);
      
      for (const block of textBlocks) {
        // Extract text from Tj operator (simple text)
        const tjMatches = block.match(/\(((?:[^()\\]|\\[()\\])*)\)\s*Tj/g);
        if (tjMatches) {
          for (const match of tjMatches) {
            const text = match.match(/\(((?:[^()\\]|\\[()\\])*)\)/)?.[1];
            if (text) {
              const decoded = text
                .replace(/\\n/g, '\n')
                .replace(/\\r/g, '')
                .replace(/\\t/g, ' ')
                .replace(/\\\(/g, '(')
                .replace(/\\\)/g, ')')
                .replace(/\\\\/g, '\\');
              textParts.push(decoded);
            }
          }
        }
        
        // Extract from TJ arrays (text with positioning)
        const tjArrayMatches = block.match(/\[([\s\S]*?)\]\s*TJ/g);
        if (tjArrayMatches) {
          for (const match of tjArrayMatches) {
            const texts = match.match(/\(((?:[^()\\]|\\[()\\])*)\)/g);
            if (texts) {
              for (const text of texts) {
                const cleaned = text
                  .replace(/[()]/g, '')
                  .replace(/\\n/g, '\n')
                  .replace(/\\r/g, '')
                  .replace(/\\t/g, ' ')
                  .replace(/\\\(/g, '(')
                  .replace(/\\\)/g, ')')
                  .replace(/\\\\/g, '\\');
                textParts.push(cleaned);
              }
            }
          }
        }
        
        // Add space between blocks
        textParts.push(' ');
      }
      
      extractedText = textParts.join('');
    }
    
    // Method 2: Fallback - extract all text in parentheses (more aggressive)
    if (extractedText.length < 50) {
      console.log('Using fallback extraction method');
      const allTextMatches = pdfString.match(/\(([^)]{2,})\)/g);
      if (allTextMatches) {
        extractedText = allTextMatches
          .map(match => match.replace(/[()]/g, ''))
          .filter(text => {
            // Filter out non-text content
            const hasLetters = /[a-zA-Z]/.test(text);
            const notOnlyNumbers = !/^[0-9\s\.\-\/]+$/.test(text);
            const notBinary = !/^[\x00-\x08\x0E-\x1F\x7F-\xFF]+$/.test(text);
            return text.length > 2 && hasLetters && notOnlyNumbers && notBinary;
          })
          .join(' ');
      }
    }
    
    // Clean up extracted text
    extractedText = extractedText
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();
    
    console.log(`Extracted ${extractedText.length} characters`);
    
    // Success threshold
    if (extractedText.length > 50) {
      const wordCount = extractedText.split(/\s+/).length;
      console.log(`Successfully extracted ${wordCount} words from PDF`);
      return extractedText;
    }
    
    // If extraction yields little text, return helpful message
    console.log('Limited text extraction from PDF');
    return `[Limited text extraction - ${extractedText.length} characters]

This PDF appears to be:
• Image-based (scanned document) - requires OCR
• Encrypted or password-protected
• Using complex encoding or special fonts
• Containing mostly images/graphics

${extractedText ? `Partial text found:\n${extractedText}\n\n` : ''}Please describe the PDF content manually, or try converting it to a text-based PDF format.`;
    
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    return `Error reading PDF: ${error instanceof Error ? error.message : 'Unknown error'}

The PDF file may be corrupted or in an unsupported format. You can:
• Try a different PDF file
• Manually describe the PDF content
• Convert the PDF to text format first`;
  }
}

/**
 * Check if file is a PDF
 */
export function isPDF(fileType: string, fileName: string): boolean {
  return fileType.includes('pdf') || fileName.toLowerCase().endsWith('.pdf');
}

/**
 * Get file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
