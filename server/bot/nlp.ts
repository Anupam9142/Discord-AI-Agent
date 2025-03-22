import { Message } from 'discord.js';
import OpenAI from 'openai';
import { addUserMessage, addBotMessage, getContext, formatContextForNLP } from './context';
import { storage } from '../storage';

// Initialize OpenAI client if API key exists, otherwise use a mock client
let openai: OpenAI;
let useOpenAI = true;

try {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey || apiKey === 'mock-key' || apiKey.startsWith('sk-proj-')) {
    console.warn('Valid OpenAI API key not provided or using API key with insufficient quota');
    throw new Error('Invalid API key or insufficient quota');
  }
  
  openai = new OpenAI({ apiKey });
  console.log('OpenAI client initialized successfully');
} catch (error) {
  console.warn('OpenAI client initialization failed, using fallback implementation');
  useOpenAI = false;
  
  // This is just for development without API keys
  openai = {
    chat: {
      completions: {
        create: async () => ({
          choices: [{ message: { content: "I'm a placeholder response. Please provide a valid OPENAI_API_KEY with sufficient quota to enable AI functionality." } }]
        })
      }
    }
  } as any;
}

export async function processNaturalLanguage(message: Message): Promise<void> {
  const userId = message.author.id;
  
  try {
    // Add user message to context
    await addUserMessage(message);
    
    // Get current conversation context
    const context = await getContext(userId);
    
    // Get bot settings
    const botSettings = await storage.getBotSettings();
    const model = botSettings?.nlpModel || 'gpt-4o'; // default to gpt-4o
    const temperature = parseFloat(botSettings?.temperature || '0.7');
    const maxTokens = botSettings?.maxTokens || 150;
    
    // Add typing indicator to show the bot is working
    try {
      // This method might not be available in all channel types
      await (message.channel as any).sendTyping?.();
    } catch (error) {
      // Ignore errors from sendTyping as it's not critical
    }
    
    let aiResponse: string;
    
    // Use fallback mode if OpenAI is not available
    if (!useOpenAI) {
      console.log('Using fallback response generator for message (OpenAI unavailable)');
      aiResponse = getFallbackResponse(message.content);
    } else {
      // Format messages for OpenAI API
      const messages = formatContextForNLP(context);
      
      // Get response from OpenAI
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      try {
        const completion = await openai.chat.completions.create({
          model: model === 'gpt' ? 'gpt-4o' : model, // Ensure we use the right model name
          messages: messages as any, // Type cast to fix TypeScript error
          temperature: temperature,
          max_tokens: maxTokens,
        });
        
        aiResponse = completion.choices[0].message.content || "I'm sorry, I couldn't generate a response.";
      } catch (error: any) {
        console.error('Error calling OpenAI API:', error);
        
        // After a failure, switch to fallback mode for future calls to avoid repeated failures
        if (error.toString && (error.toString().includes('insufficient_quota') || error.toString().includes('rate limit'))) {
          console.warn('Switching to fallback mode due to API limits');
          useOpenAI = false;
        }
        
        // Use fallback response for this request
        aiResponse = getFallbackResponse(message.content);
      }
    }
    
    // Send the response
    await message.reply(aiResponse);
    
    // Add bot response to context
    await addBotMessage(userId, aiResponse);
    
    // Log the interaction if in debug mode
    if (botSettings?.debugMode) {
      console.log('NLP Request:', {
        userId,
        prompt: message.content,
        useOpenAI,
        response: aiResponse
      });
    }
  } catch (error) {
    console.error('Error processing natural language:', error);
    
    // Send a friendly error message
    try {
      await message.reply("I'm sorry, I'm having trouble processing your request right now. Please try again later.");
    } catch (replyError) {
      console.error('Failed to send error reply:', replyError);
    }
  }
}

// Generate a response with no context (for testing)
export async function generateResponse(prompt: string): Promise<string> {
  // If we know OpenAI isn't available or configured, use deterministic fallback responses
  if (!useOpenAI) {
    console.log('Using fallback response generator (OpenAI unavailable)');
    return getFallbackResponse(prompt);
  }
  
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
      ] as any, // Type cast to fix TypeScript error
      temperature: 0.7,
      max_tokens: 150,
    });
    
    return completion.choices[0].message.content || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error('Error generating response:', error);
    // After a failure, switch to fallback mode for future calls to avoid repeated failures
    if (error.toString().includes('insufficient_quota') || error.toString().includes('rate limit')) {
      console.warn('Switching to fallback mode due to API limits');
      useOpenAI = false;
    }
    return getFallbackResponse(prompt);
  }
}

// Generate consistent fallback responses based on prompt
function getFallbackResponse(prompt: string): string {
  const promptLower = prompt.toLowerCase();
  
  // Simple pattern matching for common questions
  if (promptLower.includes('help') || promptLower.includes('command')) {
    return "I can help you with various tasks! Try commands like 'info', 'weather', 'reminder', or just chat with me naturally.";
  } else if (promptLower.includes('hello') || promptLower.includes('hi ') || promptLower === 'hi') {
    return "Hello there! I'm your AI assistant bot. How can I help you today?";
  } else if (promptLower.includes('weather')) {
    return "I'd like to provide weather information, but I'm currently running in offline mode. Please add a valid API key to enable full functionality.";
  } else if (promptLower.includes('joke') || promptLower.includes('funny')) {
    return "Why don't scientists trust atoms? Because they make up everything!";
  } else if (promptLower.includes('thank')) {
    return "You're welcome! Let me know if you need anything else.";
  } else if (promptLower.includes('discord')) {
    return "Discord is a popular communication platform designed for creating communities. Users can communicate via voice calls, video calls, text messaging, and media and files in private chats or as part of communities called 'servers'.";
  } else if (promptLower.includes('bot') || promptLower.includes('ai')) {
    return "I'm an AI assistant designed to help with conversations, answer questions, and assist with various tasks on Discord. I'm currently running with limited functionality.";
  }
  
  // Generic fallback
  return "I'm currently operating in offline mode with limited functionality. Please provide a valid OpenAI API key with sufficient quota to enable my full AI capabilities.";
}

// Analyze text sentiment
export async function analyzeSentiment(text: string): Promise<{
  rating: number,
  confidence: number
}> {
  // If OpenAI is not available, use deterministic sentiment analysis
  if (!useOpenAI) {
    console.log('Using fallback sentiment analyzer (OpenAI unavailable)');
    return getFallbackSentiment(text);
  }
  
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
      ] as any, // Type cast to fix TypeScript error
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{"rating": 3, "confidence": 0.5}');

    return {
      rating: Math.max(1, Math.min(5, Math.round(result.rating))),
      confidence: Math.max(0, Math.min(1, result.confidence)),
    };
  } catch (error) {
    console.error('Failed to analyze sentiment:', error);
    
    // After a failure, switch to fallback mode for future calls to avoid repeated failures
    if (error.toString().includes('insufficient_quota') || error.toString().includes('rate limit')) {
      console.warn('Switching to fallback mode due to API limits');
      useOpenAI = false;
    }
    
    return getFallbackSentiment(text);
  }
}

// Simple rule-based sentiment analysis for fallback
function getFallbackSentiment(text: string): { rating: number, confidence: number } {
  const textLower = text.toLowerCase();
  
  // Positive words
  const positiveWords = [
    'good', 'great', 'amazing', 'excellent', 'wonderful', 'fantastic', 'awesome',
    'happy', 'joy', 'love', 'like', 'best', 'thank', 'thanks', 'appreciate',
    'perfect', 'brilliant', 'outstanding'
  ];
  
  // Negative words
  const negativeWords = [
    'bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'dislike', 'sad',
    'angry', 'annoyed', 'disappointed', 'poor', 'fail', 'sucks', 'stupid',
    'useless', 'broken'
  ];
  
  // Count positive and negative words
  let positiveCount = 0;
  let negativeCount = 0;
  
  for (const word of positiveWords) {
    if (textLower.includes(word)) {
      positiveCount++;
    }
  }
  
  for (const word of negativeWords) {
    if (textLower.includes(word)) {
      negativeCount++;
    }
  }
  
  // Determine overall sentiment
  const totalWords = text.split(' ').length;
  const confidenceBase = Math.min(0.7, (positiveCount + negativeCount) / totalWords);
  
  if (positiveCount > negativeCount) {
    const rating = Math.min(5, 3 + Math.round((positiveCount - negativeCount) / 2));
    return { rating, confidence: confidenceBase + 0.1 };
  } else if (negativeCount > positiveCount) {
    const rating = Math.max(1, 3 - Math.round((negativeCount - positiveCount) / 2));
    return { rating, confidence: confidenceBase + 0.1 };
  } else {
    return { rating: 3, confidence: 0.5 };
  }
}
