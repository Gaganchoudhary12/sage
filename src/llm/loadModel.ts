import {initLlama, LlamaContext} from 'llama.rn';
import * as RNFS from 'react-native-fs';

let context: LlamaContext | null = null;

// Using Qwen2-0.5B for mobile stability (very small, fast, stable)
const MODEL_NAME = 'qwen2-0_5b-instruct-q4_k_m.gguf';
const MODEL_URL = 'https://huggingface.co/Qwen/Qwen2-0.5B-Instruct-GGUF/resolve/main/qwen2-0_5b-instruct-q4_k_m.gguf';

async function downloadModel(
  destPath: string,
  onProgress?: (progress: number) => void,
): Promise<void> {
  console.log('Downloading Qwen2-0.5B model...');
  console.log('This is a one-time download (~400MB)');
  console.log('Please ensure you have a stable internet connection');
  
  try {
    const downloadResult = RNFS.downloadFile({
      fromUrl: MODEL_URL,
      toFile: destPath,
      progress: res => {
        const progress = (res.bytesWritten / res.contentLength) * 100;
        console.log(`Download progress: ${progress.toFixed(1)}%`);
        if (onProgress) {
          onProgress(progress);
        }
      },
      progressInterval: 1000,
      readTimeout: 30000, // 30 second timeout
      connectionTimeout: 30000,
    });

    const result = await downloadResult.promise;
    
    if (result.statusCode === 200) {
      console.log('Model downloaded successfully!');
    } else {
      // Clean up partial download
      const exists = await RNFS.exists(destPath);
      if (exists) {
        await RNFS.unlink(destPath);
      }
      throw new Error(`Download failed with status code: ${result.statusCode}`);
    }
  } catch (error) {
    // Clean up partial download on error
    const exists = await RNFS.exists(destPath);
    if (exists) {
      await RNFS.unlink(destPath);
    }
    throw error;
  }
}

async function getModelPath(onProgress?: (progress: number) => void): Promise<string> {
  const destPath = `${RNFS.DocumentDirectoryPath}/${MODEL_NAME}`;
  const expectedSize = 400 * 1024 * 1024; // ~400MB in bytes
  const minSize = 350 * 1024 * 1024; // Minimum 350MB to be valid
  
  // Check if model already exists and is valid
  const exists = await RNFS.exists(destPath);
  if (exists) {
    const stat = await RNFS.stat(destPath);
    const fileSize = stat.size;
    
    // If file is too small, it's corrupted - delete and re-download
    if (fileSize < minSize) {
      console.log(`Model file corrupted (${(fileSize / 1024 / 1024).toFixed(2)} MB). Deleting and re-downloading...`);
      await RNFS.unlink(destPath);
    } else {
      console.log('Model already downloaded and valid');
      return destPath;
    }
  }
  
  // Download model on first launch
  await downloadModel(destPath, onProgress);
  
  // Verify download completed successfully
  const stat = await RNFS.stat(destPath);
  if (stat.size < minSize) {
    throw new Error(`Download incomplete. Expected ~400MB, got ${(stat.size / 1024 / 1024).toFixed(2)} MB`);
  }
  
  return destPath;
}

// Function to release the context (useful for cleanup)
export function releaseLLM() {
  if (context) {
    try {
      context.release();
      console.log('LLM context released');
    } catch (e) {
      console.error('Error releasing context:', e);
    }
    context = null;
  }
}

export async function loadLLM(onProgress?: (progress: number) => void) {
  // Always return existing context if available and valid
  if (context) {
    return context;
  }

  try {
    const modelPath = await getModelPath(onProgress);
    console.log('Loading Qwen2-0.5B model from:', modelPath);

    // Verify file exists
    const exists = await RNFS.exists(modelPath);
    if (!exists) {
      throw new Error('Model file not found after download');
    }

    // Get file size for logging
    const stat = await RNFS.stat(modelPath);
    console.log(`Model file size: ${(stat.size / 1024 / 1024).toFixed(2)} MB`);

    console.log('Initializing Qwen2-0.5B context...');
    console.log('This should take 10-20 seconds...');
    
    try {
      context = await initLlama({
        model: modelPath,
        use_mlock: false,
        n_ctx: 2048, // Increased from 1024 to 2048 for better PDF handling
        n_batch: 64,
        n_threads: 4,
        n_gpu_layers: 0,
      });

      console.log('Qwen2-0.5B initialized successfully!');
      return context;
    } catch (initError) {
      console.error('Failed to initialize llama context:', initError);
      throw new Error(`Model initialization failed: ${initError}. Try restarting the app or clearing app data.`);
    }
  } catch (error) {
    console.error('Failed to load LLM:', error);
    throw error;
  }
}
