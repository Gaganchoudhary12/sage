// Simple deterministic embedding using character-based hashing
// In production, use a proper embedding model like sentence-transformers
export async function getEmbedding(text: string): Promise<number[]> {
  const EMBEDDING_SIZE = 128;
  const vec = new Array(EMBEDDING_SIZE).fill(0);
  
  // Normalize text
  const normalized = text.toLowerCase().trim();
  
  // Create embedding using multiple hash functions
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    
    // Multiple hash strategies for better distribution
    vec[i % EMBEDDING_SIZE] += char;
    vec[(i * 7) % EMBEDDING_SIZE] += char * 0.5;
    vec[(i * 13) % EMBEDDING_SIZE] += char * 0.25;
  }
  
  // Normalize the vector
  const magnitude = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < vec.length; i++) {
      vec[i] /= magnitude;
    }
  }
  
  return vec;
}
