import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Chat from '@/models/Chat';
import User from '@/models/User';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import { detectIntent, extractEntities } from '@/lib/nlp';
import { translateText, detectLanguage } from '@/lib/translation';
import { llmService, LLMResponse } from '@/lib/llm-service';

interface ChatMessage {
  role: string;
  content: string;
  timestamp?: Date;
  language?: string;
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // Verify authentication
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { message } = await request.json();
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get user data
    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Detect language of the message
    const detectedLanguage = await detectLanguage(message);
    
    // Translate message to English for processing
    const translatedMessage = await translateText(message, 'en', detectedLanguage);

    // Process the message with NLP
    const intentResult = detectIntent(translatedMessage);
    const entities = extractEntities(translatedMessage);

    // Get chat history for context
    let existingChat = await Chat.findOne({ userId: user._id });
    const chatHistory = existingChat ? existingChat.messages.slice(-10).map((msg: ChatMessage) => ({
      role: msg.role,
      content: msg.content
    })) : [];

    // Generate response using Gemini LLM
    let medicalResponse: LLMResponse;
    let useLLM = true;
    
    if (useLLM) {
      try {
        medicalResponse = await llmService.generateResponse(
          message,
          intentResult.intent,
          entities.entities,
          user.Diseases,
          user.preferredLanguage,
          chatHistory
        );
      } catch (error) {
        console.error('Gemini LLM service failed:', error);
        // Fallback response
        medicalResponse = {
          response: "I apologize, but I'm having trouble processing your request right now. Please try again or consult with a healthcare professional.",
          suggestions: ["Try rephrasing your question", "Consult a healthcare professional"],
          emergency: false,
          confidence: 0.1
        };
        useLLM = false;
      }
    } else {
      // Fallback response when LLM is disabled
      medicalResponse = {
        response: "I apologize, but the AI service is currently unavailable. Please consult with a healthcare professional for medical advice.",
        suggestions: ["Consult a healthcare professional", "Contact your doctor"],
        emergency: false,
        confidence: 0.1
      };
    }

    // Translate response if needed (Gemini might already respond in user's language)
    let finalResponse = medicalResponse.response;
    let translatedSuggestions = medicalResponse.suggestions;
    
    if (!useLLM || user.preferredLanguage !== 'en') {
      finalResponse = await translateText(
        medicalResponse.response,
        user.preferredLanguage,
        'en'
      );

      translatedSuggestions = await Promise.all(
        medicalResponse.suggestions.map(suggestion =>
          translateText(suggestion, user.preferredLanguage, 'en')
        )
      );
    }

    // Save chat to database
    if (!existingChat) {
      existingChat = new Chat({ userId: user._id, messages: [] });
    }

    // Add user message
    existingChat.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
      language: detectedLanguage,
    });

    // Add assistant response
    existingChat.messages.push({
      role: 'assistant',
      content: finalResponse,
      timestamp: new Date(),
      language: user.preferredLanguage,
    });

    await existingChat.save();

    return NextResponse.json({
      response: finalResponse,
      suggestions: translatedSuggestions,
      emergency: medicalResponse.emergency,
      followUp: medicalResponse.followUp ? 
        await translateText(medicalResponse.followUp, user.preferredLanguage, 'en') : 
        undefined,
      intent: intentResult.intent,
      confidence: medicalResponse.confidence,
      entities: entities,
      detectedLanguage,
      geminiUsed: useLLM,
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Verify authentication
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get chat history
    const chat = await Chat.findOne({ userId: payload.userId });
    if (!chat) {
      return NextResponse.json({ messages: [] });
    }

    return NextResponse.json({ messages: chat.messages });
  } catch (error) {
    console.error('Get chat history error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
          