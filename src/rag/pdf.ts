// NOTE: In a real app, use a proper PDF parser native module.
// Here we assume you already have text extracted or use a backend tool.
import * as RNFS from 'react-native-fs';

export async function loadPdfText(localPath: string): Promise<string> {
  // For demo, we just read a .txt file or pre-extracted text.
  // Replace this with real PDF → text logic later.
  const text = await RNFS.readFile(localPath, 'utf8');
  return text;
}

export function chunkText(text: string, chunkSize = 800) {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + chunkSize));
    i += chunkSize;
  }
  return chunks;
}
