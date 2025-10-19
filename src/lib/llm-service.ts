import { SupportedLanguage } from './translation';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface LLMResponse {
  response: string;
  suggestions: string[];
  emergency: boolean;
  followUp?: string;
  confidence: number;
}

export interface LLMConfig {
  provider: 'gemini';
  apiKey?: string;
  model?: string;
}

class LLMService {
  private config: LLMConfig;
  private genAI?: GoogleGenerativeAI;

  constructor(config: LLMConfig) {
    this.config = config;
    if (config.apiKey) {
      this.genAI = new GoogleGenerativeAI(config.apiKey);
    }
  }

  async generateResponse(
    userMessage: string,
    intent: string,
    entities: string[],
    userDiseases: string[],
    language: SupportedLanguage,
    chatHistory: Array<{role: string, content: string}> = []
  ): Promise<LLMResponse> {
    
    const systemPrompt = this.buildSystemPrompt(userDiseases, language);
    const userPrompt = this.buildUserPrompt(userMessage, intent, entities, language);

    try {
      return await this.callGemini(systemPrompt, userPrompt, chatHistory);
    } catch (error) {
      console.error('Gemini LLM service error:', error);
      return this.getFallbackResponse(language);
    }
  }

  private buildSystemPrompt(userDiseases: string[], language: SupportedLanguage): string {
    const diseaseContext = userDiseases.length > 0 
      ? `\nIMPORTANT: The user has diseases to: ${userDiseases.join(', ')}. Always consider this when providing medical advice.`
      : '';

    const languageInstruction = language === 'en' 
      ? 'Respond in English.'
      : language === 'hi' 
      ? 'Respond in Hindi (हिंदी में जवाब दें).'
      : 'Respond in Telugu (తెలుగులో జవాబు ఇవ్వండి).';

    return `You are a helpful healthcare assistant AI. Your role is to provide general health information and guidance while emphasizing the importance of professional medical consultation.

Guidelines:
- Provide accurate, evidence-based health information
- Always recommend consulting healthcare professionals for serious concerns
- Be empathetic and supportive
- Avoid providing specific medical diagnoses
- Suggest preventive measures and general wellness advice
- If symptoms suggest an emergency, clearly state this
- Consider user diseases when providing advice${diseaseContext}

${languageInstruction}

IMPORTANT: You must respond ONLY with valid JSON in the following exact format. Do not include any additional text, explanations, or markdown formatting:

{
  "response": "Your main response to the user",
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"],
  "emergency": false,
  "followUp": "Optional follow-up question",
  "confidence": 0.8
}`;
  }

  private buildUserPrompt(
    userMessage: string, 
    intent: string, 
    entities: string[], 
    language: SupportedLanguage
  ): string {
    return `User message: "${userMessage}"
Detected intent: ${intent}
Extracted entities: ${entities.join(', ')}

Please provide a helpful response considering the user's query, detected intent, and extracted medical entities.`;
  }


  private async callGemini(
    systemPrompt: string, 
    userPrompt: string, 
    chatHistory: Array<{role: string, content: string}>
  ): Promise<LLMResponse> {
    if (!this.genAI) {
      throw new Error('Gemini AI not initialized');
    }

    const model = this.genAI.getGenerativeModel({ 
      model: this.config.model || 'gemini-1.5-flash' 
    });

    // Build the conversation history for Gemini
    const history = chatHistory.slice(-6).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const chat = model.startChat({
      history: history,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
    });

    const fullPrompt = `${systemPrompt}\n\nUser query: ${userPrompt}`;
    
    const result = await chat.sendMessage(fullPrompt);
    const response = await result.response;
    const content = response.text();
    
    return this.parseLLMResponse(content);
  }

  private parseLLMResponse(content: string): LLMResponse {
    try {
      // Clean the content - remove any markdown formatting or extra text
      let cleanContent = content.trim();
      
      // Remove markdown code blocks if present
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Try to extract JSON from the content if it's embedded in text
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanContent = jsonMatch[0];
      }
      
      // Parse the JSON
      const parsed = JSON.parse(cleanContent);
      return {
        response: parsed.response || content,
        suggestions: parsed.suggestions || [],
        emergency: parsed.emergency || false,
        followUp: parsed.followUp,
        confidence: parsed.confidence || 0.8,
      };
    } catch (error) {
      console.error('JSON parsing failed:', error);
      console.error('Content was:', content);
      
      // If JSON parsing fails, treat the entire content as response
      return {
        response: content,
        suggestions: [],
        emergency: false,
        confidence: 0.7,
      };
    }
  }

  private getFallbackResponse(language: SupportedLanguage): LLMResponse {
    const responses = {
      en: {
        response: "I apologize, but I'm having trouble processing your request right now. Please try again or consult with a healthcare professional for immediate assistance.",
        suggestions: ["Try rephrasing your question", "Consult a healthcare professional", "Check your internet connection"],
        emergency: false,
        confidence: 0.1,
      },
      hi: {
        response: "मुझे खेद है, लेकिन मैं अभी आपके अनुरोध को संसाधित करने में परेशानी हो रही हूं। कृपया पुनः प्रयास करें या तत्काल सहायता के लिए स्वास्थ्य देखभाल पेशेवर से परामर्श करें।",
        suggestions: ["अपना प्रश्न फिर से लिखें", "स्वास्थ्य देखभाल पेशेवर से परामर्श करें", "अपना इंटरनेट कनेक्शन जांचें"],
        emergency: false,
        confidence: 0.1,
      },
      te: {
        response: "క్షమించండి, కానీ నేను ప్రస్తుతం మీ అభ్యర్థనను ప్రాసెస్ చేయడంలో సమస్యను ఎదుర్కొంటున్నాను. దయచేసి మళ్లీ ప్రయత్నించండి లేదా తక్షణ సహాయం కోసం ఆరోగ్య సంరక్షణ నిపుణుడిని సంప్రదించండి.",
        suggestions: ["మీ ప్రశ్నను మళ్లీ రాయండి", "ఆరోగ్య సంరక్షణ నిపుణుడిని సంప్రదించండి", "మీ ఇంటర్నెట్ కనెక్షన్‌ను తనిఖీ చేయండి"],
        emergency: false,
        confidence: 0.1,
      },
    };

    return responses[language as keyof typeof responses];
  }
}

// Export singleton instance
const config: LLMConfig = {
  provider: 'gemini',
  apiKey: "AIzaSyDMWpTqbtO91ZFtUcOyA9YkxbywpVc83w0",
  model:  'gemini-2.5-flash-lite',
};

export const llmService = new LLMService(config);
