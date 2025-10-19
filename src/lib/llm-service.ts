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
    chatHistory: Array<{ role: string; content: string }> = []
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
      ? `\nIMPORTANT: The user has diseases: ${userDiseases.join(', ')}. Always consider this when providing medical advice.`
      : '';

    const languageInstructionMap: Record<SupportedLanguage, string> = {
      en: 'Respond in English.',
      hi: 'Respond in Hindi (हिंदी में जवाब दें).',
      te: 'Respond in Telugu (తెలుగులో జవాబు ఇవ్వండి).',
      ta: 'Respond in Tamil (தமிழில் பதிலளிக்கவும்).',
      kn: 'Respond in Kannada (ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರಿಸಿ).',
      ml: 'Respond in Malayalam (മലയാളത്തിൽ മറുപടി നൽകുക).',
    };

    const languageInstruction = languageInstructionMap[language] || 'Respond in English.';

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
    const languageNote = {
      en: 'User prefers English.',
      hi: 'User prefers Hindi.',
      te: 'User prefers Telugu.',
      ta: 'User prefers Tamil.',
      kn: 'User prefers Kannada.',
      ml: 'User prefers Malayalam.',
    }[language];

    return `User message: "${userMessage}"
Detected intent: ${intent}
Extracted entities: ${entities.join(', ')}
${languageNote}

Please provide a helpful response considering the user's query, detected intent, and extracted medical entities.`;
  }

  private async callGemini(
    systemPrompt: string,
    userPrompt: string,
    chatHistory: Array<{ role: string; content: string }>
  ): Promise<LLMResponse> {
    if (!this.genAI) {
      throw new Error('Gemini AI not initialized');
    }

    const model = this.genAI.getGenerativeModel({
      model: this.config.model || 'gemini-1.5-flash',
    });

    const history = chatHistory.slice(-6).map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history,
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
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanContent = jsonMatch[0];
      }

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
      return {
        response: content,
        suggestions: [],
        emergency: false,
        confidence: 0.7,
      };
    }
  }

  private getFallbackResponse(language: SupportedLanguage): LLMResponse {
    const responses: Record<SupportedLanguage, LLMResponse> = {
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
      ta: {
        response: "மன்னிக்கவும், தற்போது உங்கள் கோரிக்கையை செயலாக்குவதில் சிக்கல் ஏற்படுகிறது. தயவுசெய்து மீண்டும் முயற்சிக்கவும் அல்லது உடனடி உதவிக்காக ஒரு சுகாதார நிபுணரிடம் ஆலோசிக்கவும்.",
        suggestions: ["உங்கள் கேள்வியை மறுபடியும் எழுதுங்கள்", "மருத்துவரிடம் ஆலோசிக்கவும்", "இணைய இணைப்பை சரிபார்க்கவும்"],
        emergency: false,
        confidence: 0.1,
      },
      kn: {
        response: "ಕ್ಷಮಿಸಿ, ನಾನು ಪ್ರಸ್ತುತ ನಿಮ್ಮ ವಿನಂತಿಯನ್ನು ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲು ತೊಂದರೆಯನ್ನು ಎದುರಿಸುತ್ತಿದ್ದೇನೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ ತುರ್ತು ಸಹಾಯಕ್ಕಾಗಿ ಆರೋಗ್ಯ ತಜ್ಞರನ್ನು ಸಂಪರ್ಕಿಸಿ.",
        suggestions: ["ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಮರುಬರೆಯಿರಿ", "ಆರೋಗ್ಯ ತಜ್ಞರನ್ನು ಸಂಪರ್ಕಿಸಿ", "ನಿಮ್ಮ ಇಂಟರ್ನೆಟ್ ಸಂಪರ್ಕವನ್ನು ಪರಿಶೀಲಿಸಿ"],
        emergency: false,
        confidence: 0.1,
      },
      ml: {
        response: "ക്ഷമിക്കണം, നിങ്ങളുടെ അഭ്യർത്ഥന ഇപ്പോൾ പ്രോസസ്സ് ചെയ്യുന്നതിൽ ബുദ്ധിമുട്ട് നേരിടുന്നു. ദയവായി വീണ്ടും ശ്രമിക്കുക അല്ലെങ്കിൽ അടിയന്തര സഹായത്തിനായി ഒരു ഹെൽത്ത് കെയർ പ്രൊഫഷണലുമായി ബന്ധപ്പെടുക.",
        suggestions: ["നിങ്ങളുടെ ചോദ്യം പുനഃരചിക്കുക", "ഹെൽത്ത് കെയർ പ്രൊഫഷണലുമായി ബന്ധപ്പെടുക", "നിങ്ങളുടെ ഇന്റർനെറ്റ് കണക്ഷൻ പരിശോധിക്കുക"],
        emergency: false,
        confidence: 0.1,
      },
    };

    return responses[language];
  }
}

// Export singleton instance
const config: LLMConfig = {
  provider: 'gemini',
  apiKey: "AIzaSyDMWpTqbtO91ZFtUcOyA9YkxbywpVc83w0",
  model: 'gemini-2.5-flash-lite',
};

export const llmService = new LLMService(config);
