const API_KEY = "AIzaSyAkeATxRuVzdqQSEWa0w7SXMXzVgBAw9ks";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

// Context from help page to train the model
const helpContext = `
CloudShare is a file sharing platform with the following features:
- File size limits: Free(50MB), Pro(2GB), Premium(Unlimited)
- Security: Password protection, end-to-end encryption
- File management: Upload, share, delete, recover
- Storage duration: 7-90 days based on plan
- Email sharing and link generation
- Multiple file types support
- Recycle bin with 30-day retention
`;

export async function getGeminiResponse(userInput) {
  try {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Context: ${helpContext}\n\nUser Question: ${userInput}\n\nProvide a helpful, concise response about CloudShare:`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Gemini API Error:', error);
    return "I'm having trouble connecting to my knowledge base. Please try again later.";
  }
}
