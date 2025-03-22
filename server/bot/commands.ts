import { Message, EmbedBuilder } from 'discord.js';
import { storage } from '../storage';
import axios from 'axios';
import { processNaturalLanguage } from './nlp';

interface Command {
  name: string;
  description: string;
  execute: (message: Message, args: string[]) => Promise<void>;
}

// Command collection
const commands = new Map<string, Command>();

// Help command
commands.set('help', {
  name: 'help',
  description: 'Show this help message',
  execute: async (message, args) => {
    const commandArg = args[0]?.toLowerCase();
    
    // If a specific command was asked for
    if (commandArg && commands.has(commandArg)) {
      const command = commands.get(commandArg)!;
      const embed = new EmbedBuilder()
        .setTitle(`Command: !${command.name}`)
        .setDescription(command.description)
        .setColor(0x5865F2);
      
      await message.reply({ embeds: [embed] });
      return;
    }
    
    // General help listing all commands
    const embed = new EmbedBuilder()
      .setTitle('Available Commands')
      .setDescription('Here are all the commands you can use:')
      .setColor(0x5865F2);
    
    commands.forEach((cmd, name) => {
      embed.addFields({ name: `!${name}`, value: cmd.description });
    });
    
    embed.addFields({ 
      name: 'Natural Language', 
      value: 'You can also talk to me naturally and I\'ll try to understand your request!' 
    });
    
    await message.reply({ embeds: [embed] });
    
    // Increment usage counter
    await storage.updateCommandUsage('help');
  }
});

// Weather command
commands.set('weather', {
  name: 'weather',
  description: 'Get weather for a location: !weather [location]',
  execute: async (message, args) => {
    if (!args.length) {
      await message.reply('Please specify a location. Example: !weather New York');
      return;
    }
    
    const location = args.join(' ');
    const weatherApi = await storage.getApiIntegrationByName('Weather API');
    
    if (!weatherApi || !weatherApi.active) {
      await message.reply('Weather service is currently unavailable.');
      return;
    }
    
    try {
      const apiKey = weatherApi.apiKey || process.env.WEATHER_API_KEY;
      if (!apiKey) {
        await message.reply('Weather API key is not configured.');
        return;
      }
      
      const url = `${weatherApi.endpoint}?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric`;
      const response = await axios.get(url);
      
      if (response.data) {
        const weather = response.data;
        const temp = weather.main.temp;
        const condition = weather.weather[0].description;
        const city = weather.name;
        const country = weather.sys.country;
        
        const embed = new EmbedBuilder()
          .setTitle(`Weather in ${city}, ${country}`)
          .setDescription(`Current weather: ${condition}`)
          .addFields(
            { name: 'Temperature', value: `${temp}°C (${(temp * 9/5 + 32).toFixed(1)}°F)`, inline: true },
            { name: 'Humidity', value: `${weather.main.humidity}%`, inline: true },
            { name: 'Wind', value: `${weather.wind.speed} m/s`, inline: true }
          )
          .setThumbnail(`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`)
          .setColor(0x3498DB)
          .setTimestamp();
        
        await message.reply({ embeds: [embed] });
        
        // Update usage stats
        await storage.updateApiIntegrationUsage(weatherApi.id);
        await storage.updateCommandUsage('weather');
      }
    } catch (error) {
      console.error('Weather API error:', error);
      await message.reply('Sorry, I couldn\'t retrieve the weather information. Please try again later.');
    }
  }
});

// Translate command
commands.set('translate', {
  name: 'translate',
  description: 'Translate text to another language: !translate [targetLang] [text]',
  execute: async (message, args) => {
    if (args.length < 2) {
      await message.reply('Please specify a target language and text. Example: !translate es Hello, how are you?');
      return;
    }
    
    const targetLang = args[0].toLowerCase();
    const text = args.slice(1).join(' ');
    const translationApi = await storage.getApiIntegrationByName('Translation API');
    
    if (!translationApi || !translationApi.active) {
      await message.reply('Translation service is currently unavailable.');
      return;
    }
    
    try {
      const apiKey = translationApi.apiKey || process.env.TRANSLATION_API_KEY;
      if (!apiKey) {
        await message.reply('Translation API key is not configured.');
        return;
      }
      
      const url = `${translationApi.endpoint}?key=${apiKey}`;
      const response = await axios.post(url, {
        q: text,
        target: targetLang,
        format: 'text'
      });
      
      if (response.data && response.data.data && response.data.data.translations) {
        const translation = response.data.data.translations[0].translatedText;
        
        const embed = new EmbedBuilder()
          .setTitle('Translation')
          .addFields(
            { name: 'Original Text', value: text },
            { name: `Translated (${targetLang})`, value: translation }
          )
          .setColor(0x9B59B6)
          .setTimestamp();
        
        await message.reply({ embeds: [embed] });
        
        // Update usage stats
        await storage.updateApiIntegrationUsage(translationApi.id);
        await storage.updateCommandUsage('translate');
      }
    } catch (error) {
      console.error('Translation API error:', error);
      await message.reply('Sorry, I couldn\'t translate your text. Please try again later.');
    }
  }
});

// News command
commands.set('news', {
  name: 'news',
  description: 'Get latest news headlines: !news [category]',
  execute: async (message, args) => {
    const category = args[0]?.toLowerCase() || 'general';
    const validCategories = ['business', 'entertainment', 'general', 'health', 'science', 'sports', 'technology'];
    
    if (!validCategories.includes(category)) {
      await message.reply(`Invalid category. Please choose from: ${validCategories.join(', ')}`);
      return;
    }
    
    const newsApi = await storage.getApiIntegrationByName('News API');
    
    if (!newsApi || !newsApi.active) {
      await message.reply('News service is currently unavailable.');
      return;
    }
    
    try {
      const apiKey = newsApi.apiKey || process.env.NEWS_API_KEY;
      if (!apiKey) {
        await message.reply('News API key is not configured.');
        return;
      }
      
      const url = `${newsApi.endpoint}?country=us&category=${category}&apiKey=${apiKey}`;
      const response = await axios.get(url);
      
      if (response.data && response.data.articles) {
        const articles = response.data.articles.slice(0, 5); // Get top 5 headlines
        
        const embed = new EmbedBuilder()
          .setTitle(`Top ${category.charAt(0).toUpperCase() + category.slice(1)} News Headlines`)
          .setColor(0xE74C3C)
          .setTimestamp();
        
        articles.forEach((article: any, index: number) => {
          embed.addFields({
            name: `${index + 1}. ${article.title}`,
            value: `${article.description || 'No description'}\n[Read more](${article.url})`
          });
        });
        
        await message.reply({ embeds: [embed] });
        
        // Update usage stats
        await storage.updateApiIntegrationUsage(newsApi.id);
        await storage.updateCommandUsage('news');
      }
    } catch (error) {
      console.error('News API error:', error);
      await message.reply('Sorry, I couldn\'t retrieve the news. Please try again later.');
    }
  }
});

// Remind command
commands.set('remind', {
  name: 'remind',
  description: 'Set a reminder: !remind [time in minutes] [message]',
  execute: async (message, args) => {
    if (args.length < 2) {
      await message.reply('Please specify a time and message. Example: !remind 30 Check on the pizza');
      return;
    }
    
    const minutes = parseInt(args[0]);
    if (isNaN(minutes) || minutes <= 0 || minutes > 1440) { // Max 24 hours (1440 mins)
      await message.reply('Please provide a valid time in minutes (1-1440).');
      return;
    }
    
    const reminderText = args.slice(1).join(' ');
    
    await message.reply(`I'll remind you about "${reminderText}" in ${minutes} minute(s).`);
    
    // Set the reminder using setTimeout
    setTimeout(async () => {
      try {
        await message.author.send(`Reminder: ${reminderText}`);
      } catch (error) {
        // If DM fails, try to send in the original channel
        try {
          await message.channel.send(`<@${message.author.id}> Reminder: ${reminderText}`);
        } catch (channelError) {
          console.error('Failed to send reminder:', channelError);
        }
      }
    }, minutes * 60 * 1000);
    
    // Update command usage
    await storage.updateCommandUsage('remind');
  }
});

// Stats command
commands.set('stats', {
  name: 'stats',
  description: 'Show your interaction statistics with the bot',
  execute: async (message, args) => {
    const userId = message.author.id;
    
    // Get user's active conversations
    const activeConversation = await storage.getActiveConversationByUserId(userId);
    const allConversations = await storage.getConversationsByUserId(userId);
    const moderationActions = await storage.getModerationActionsByUserId(userId);
    
    const embed = new EmbedBuilder()
      .setTitle('Your Bot Interaction Statistics')
      .setDescription(`Statistics for <@${userId}>`)
      .addFields(
        { name: 'Total Conversations', value: allConversations.length.toString(), inline: true },
        { name: 'Active Conversations', value: activeConversation ? '1' : '0', inline: true },
        { name: 'Moderation Actions', value: moderationActions.length.toString(), inline: true }
      )
      .setColor(0x2ECC71)
      .setTimestamp();
    
    // Add latest conversation context if exists and user tracking is enabled
    const botSettings = await storage.getBotSettings();
    if (botSettings?.userTracking && activeConversation) {
      const contextLength = Array.isArray(activeConversation.context) ? activeConversation.context.length : 0;
      embed.addFields({ 
        name: 'Current Context Length', 
        value: `${contextLength} messages in memory` 
      });
    }
    
    await message.reply({ embeds: [embed] });
    
    // Update command usage
    await storage.updateCommandUsage('stats');
  }
});

// Process a command message
export async function handleCommand(message: Message, prefix: string) {
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift()?.toLowerCase();
  
  if (!commandName) return;
  
  const command = commands.get(commandName);
  
  if (!command) {
    // If command not found, try to process as natural language
    await processNaturalLanguage(message);
    return;
  }
  
  try {
    await command.execute(message, args);
  } catch (error) {
    console.error(`Error executing command ${commandName}:`, error);
    await message.reply('There was an error executing that command. Please try again later.');
  }
}

// Export commands for other modules
export function getAllCommands() {
  return Array.from(commands.entries()).map(([name, command]) => ({
    name,
    description: command.description
  }));
}
