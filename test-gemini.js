// Simple test script to verify Gemini integration
// Run with: node test-gemini.js

const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.log('❌ GEMINI_API_KEY not found in environment variables');
    console.log('Please set your Gemini API key in .env.local');
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are a helpful healthcare assistant. Respond in JSON format:
{
  "response": "Your response here",
  "suggestions": ["suggestion1", "suggestion2"],
  "emergency": false,
  "confidence": 0.8
}

User query: "I have a headache, what should I do?"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Gemini API is working!');
    console.log('Response:', text);
    
    // Try to parse JSON
    try {
      const parsed = JSON.parse(text);
      console.log('✅ JSON parsing successful:', parsed);
    } catch (e) {
      console.log('⚠️  Response is not valid JSON, but API is working');
    }
    
  } catch (error) {
    console.log('❌ Gemini API test failed:', error.message);
  }
}

testGemini();
