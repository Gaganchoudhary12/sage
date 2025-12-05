import {loadLLM} from './loadModel';

// Qwen2 chat template with conversation history
function formatPrompt(userMessage: string, conversationHistory?: Array<{role: 'user' | 'assistant', content: string}>): string {
  let prompt = `<|im_start|>system
You are Sage, a helpful AI assistant. Answer questions clearly and concisely.

Rules:
- Give direct, short answers
- If you don't know, say "I don't know"
- Never make up information
- Stop after answering the question
- Use simple, clear language<|im_end|>
`;

  // Add conversation history if provided
  if (conversationHistory && conversationHistory.length > 0) {
    for (const msg of conversationHistory) {
      prompt += `<|im_start|>${msg.role}
${msg.content}<|im_end|>
`;
    }
  }

  // Add current user message
  prompt += `<|im_start|>user
${userMessage}<|im_end|>
<|im_start|>assistant
`;

  return prompt;
}

export async function generateResponse(
  prompt: string,
  onStream?: (chunk: string) => void,
  conversationHistory?: Array<{role: 'user' | 'assistant', content: string}>,
) {
  try {
    const context = await loadLLM();

    // Format the prompt for Qwen2 with conversation history
    const formattedPrompt = formatPrompt(prompt, conversationHistory);

    let full = '';

    let gibberishCount = 0;
    
    await context.completion(
      {
        prompt: formattedPrompt,
        n_predict: 80, // Even shorter to reduce hallucination
        temperature: 0.1, // Very low temperature for maximum focus
        top_p: 0.7, // More restrictive
        top_k: 10, // Very limited token choices
        stop: ['<|im_end|>', '<|im_start|>', '\n\n\n', 'User:', 'Question:', '\n\nQ:', '\n\n'],
      },
      (data) => {
        const token = data.token;
        
        // Detect gibberish patterns
        const hasRepeatedChars = /([^\w\s])\1{3,}/.test(token) || // 3+ repeated special chars
                                /([a-zA-Z])\1{3,}/.test(token);   // 3+ repeated letters
        const hasOnlySpecialChars = /^[^\w\s]{5,}$/.test(token);
        
        if (hasRepeatedChars || hasOnlySpecialChars) {
          gibberishCount++;
          console.warn('Detected gibberish pattern:', token);
          
          // Stop if we see gibberish twice
          if (gibberishCount >= 2) {
            console.warn('Too much gibberish, stopping generation');
            return;
          }
        }
        
        full += token;
        if (onStream) {
          onStream(token);
        }
      },
    );

    return full.trim();
  } catch (error) {
    console.error('Error in generateResponse:', error);
    throw new Error('Failed to generate response. The model may need to be reloaded. Please restart the app.');
  }
}
