import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

const TestInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      content: 'Hello! How can I assist you today? You can ask me questions, request information, or use any of my commands.',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: settings } = useQuery({
    queryKey: ['/api/settings'],
  });

  const generateResponseMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const response = await apiRequest('POST', '/api/test/generate', { prompt });
      return response.json();
    },
    onSuccess: (data) => {
      const newBotMessage: Message = {
        id: Date.now().toString(),
        sender: 'bot',
        content: data.response,
        timestamp: new Date()
      };
      setMessages(prevMessages => [...prevMessages, newBotMessage]);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate a response',
        variant: 'destructive',
      });
    }
  });

  // Scroll to bottom of messages on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    // Add user message
    const newUserMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content: inputValue,
      timestamp: new Date()
    };
    
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    
    // Generate response
    generateResponseMutation.mutate(inputValue);
    
    // Clear input field
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      id: Date.now().toString(),
      sender: 'bot',
      content: 'Chat cleared. How can I help you today?',
      timestamp: new Date()
    }]);
  };

  return (
    <div className="bg-discord-dark rounded-lg shadow">
      <div className="px-5 py-4 border-b border-gray-700">
        <h2 className="text-white font-semibold">Test Interface</h2>
      </div>
      <div className="p-5">
        <div className="bg-gray-800 rounded-lg p-4 h-64 overflow-y-auto mb-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="flex items-start">
                <div className={`w-8 h-8 ${message.sender === 'bot' ? 'bg-discord-blurple' : 'bg-gray-600'} rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center`}>
                  <span className="text-white font-semibold text-sm">
                    {message.sender === 'bot' ? 'AI' : 'You'}
                  </span>
                </div>
                <div className="ml-3 flex-1">
                  <p className={`${message.sender === 'bot' ? 'text-discord-success' : 'text-white'} font-medium`}>
                    {message.sender === 'bot' ? 'AI Bot' : 'You'}
                  </p>
                  <p className="text-sm text-gray-300 mt-1">{message.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        <div className="flex items-center mt-3">
          <div className="relative flex-1">
            <Input
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-l-md text-white focus:outline-none focus:ring-2 focus:ring-discord-blurple"
              placeholder="Type a message or command..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={generateResponseMutation.isPending}
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-2 text-gray-400">
              <button className="hover:text-white">
                <i className="fas fa-paperclip"></i>
              </button>
              <button className="hover:text-white">
                <i className="fas fa-code"></i>
              </button>
            </div>
          </div>
          <Button 
            className="flex-shrink-0 px-4 py-2 bg-discord-blurple hover:bg-blue-600 text-white rounded-r-md"
            onClick={handleSendMessage}
            disabled={generateResponseMutation.isPending || !inputValue.trim()}
          >
            <i className="fas fa-paper-plane"></i>
          </Button>
        </div>
        
        <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
          <div>
            <span>Prefix: !</span>
            <span className="mx-2">|</span>
            <span>Context: {settings?.contextAwareness ? 'Enabled' : 'Disabled'}</span>
          </div>
          <div>
            <button 
              className="text-discord-blurple hover:underline"
              onClick={clearChat}
            >
              Clear Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestInterface;
