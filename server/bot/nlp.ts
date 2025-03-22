import { Message } from 'discord.js';
import OpenAI from 'openai';
import { addUserMessage, addBotMessage, getContext, formatContextForNLP } from './context';
import { storage } from '../storage';

// Initialize OpenAI client if API key exists, otherwise use a mock client
let openai: OpenAI;

try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'mock-key'
  });
} catch (error) {
  console.warn('OpenAI client initialization failed, using fallback implementation');
  // This is just for development without API keys
  openai = {
    chat: {
      completions: {
        create: async () => ({
          choices: [{ message: { content: "I'm a placeholder response. Please provide an OPENAI_API_KEY to enable AI functionality." } }]
        })
      }
    }
  } as any;
}

export async function processNaturalLanguage(message: Message): Promise<void> {
  try {
    const userId = message.author.id;
    
    // Add user message to context
    await addUserMessage(message);
    
    // Get current conversation context
    const context = await getContext(userId);
    
    // Get bot settings
    const botSettings = await storage.getBotSettings();
    const model = botSettings?.nlpModel || 'gpt-4o'; // default to gpt-4o
    const temperature = parseFloat(botSettings?.temperature || '0.7');
    const maxTokens = botSettings?.maxTokens || 150;
    
    // Format messages for OpenAI API
    const messages = formatContextForNLP(context);
    
    // Add typing indicator
    try {
      // This method might not be available in all channel types
      await (message.channel as any).sendTyping?.();
    } catch (error) {
      // Ignore errors from sendTyping as it's not critical
    }
    
    // Get response from OpenAI
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const completion = await openai.chat.completions.create({
      model: model === 'gpt' ? 'gpt-4o' : model, // Ensure we use the right model name
      messages: messages,
      temperature: temperature,
      max_tokens: maxTokens,
    });
    
    const aiResponse = completion.choices[0].message.content || "I'm sorry, I couldn't generate a response.";
    
    // Send the response
    await message.reply(aiResponse);
    
    // Add bot response to context
    await addBotMessage(userId, aiResponse);
    
    // Log the interaction if in debug mode
    if (botSettings?.debugMode) {
      console.log('NLP Request:', {
        userId,
        prompt: message.content,
        context: messages,
        response: aiResponse
      });
    }
  } catch (error) {
    console.error('Error processing natural language:', error);
    
    // Send a friendly error message
    await message.reply("I'm sorry, I'm having trouble processing your request right now. Please try again later.");
  }
}

// Generate a response with no context (for testing)
export async function generateResponse(prompt: string): Promise<string> {
  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful Discord bot assistant. Provide concise, accurate information. If you don\'t know something, say so rather than making up information.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 150,
    });
    
    return completion.choices[0].message.content || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error('Error generating response:', error);
    return "I'm sorry, I'm having trouble processing your request right now.";
  }
}

// Analyze text sentiment
export async function analyzeSentiment(text: string): Promise<{
  rating: number,
  confidence: number
}> {
  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a sentiment analysis expert. Analyze the sentiment of the text and provide a rating from 1 to 5 stars and a confidence score between 0 and 1. Respond with JSON in this format: { 'rating': number, 'confidence': number }",
        },
        {
          role: "user",
          content: text,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{"rating": 3, "confidence": 0.5}');

    return {
      rating: Math.max(1, Math.min(5, Math.round(result.rating))),
      confidence: Math.max(0, Math.min(1, result.confidence)),
    };
  } catch (error) {
    console.error('Failed to analyze sentiment:', error);
    // Default neutral sentiment with low confidence on error
    return {
      rating: 3,
      confidence: 0.1,
    };
  }
}
