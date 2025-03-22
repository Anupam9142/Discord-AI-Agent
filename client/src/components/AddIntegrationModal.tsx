import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface AddIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  name: string;
  type: string;
  endpoint: string;
  authMethod: string;
  apiKey: string;
  active: boolean;
  monthlyLimit: number;
}

const AddIntegrationModal: React.FC<AddIntegrationModalProps> = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: 'weather',
    endpoint: '',
    authMethod: 'api-key',
    apiKey: '',
    active: true,
    monthlyLimit: 1000
  });

  const addIntegrationMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest('POST', '/api/integrations', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations'] });
      toast({
        title: 'Integration Added',
        description: 'The new API integration has been added successfully.',
        variant: 'default',
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error Adding Integration',
        description: error.message || 'An error occurred while adding the integration.',
        variant: 'destructive',
      });
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'number' ? parseInt(value) : value
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSwitchChange = () => {
    setFormData({
      ...formData,
      active: !formData.active
    });
  };

  const handleSubmit = () => {
    // Validate form
    if (!formData.name) {
      toast({
        title: 'Validation Error',
        description: 'Please enter an API name.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.endpoint) {
      toast({
        title: 'Validation Error',
        description: 'Please enter an API endpoint URL.',
        variant: 'destructive',
      });
      return;
    }

    // Submit form
    addIntegrationMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-discord-dark border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-white">Add API Integration</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-sm font-medium text-gray-300" htmlFor="api-name">
              API Name
            </Label>
            <Input 
              id="api-name"
              name="name"
              className="mt-1 w-full bg-gray-800 border-gray-700 text-white"
              placeholder="Weather API"
              value={formData.name}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium text-gray-300" htmlFor="api-type">
              API Type
            </Label>
            <Select 
              value={formData.type} 
              onValueChange={(value) => handleSelectChange('type', value)}
            >
              <SelectTrigger id="api-type" className="mt-1 w-full bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                <SelectItem value="weather">Weather</SelectItem>
                <SelectItem value="news">News</SelectItem>
                <SelectItem value="translation">Translation</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-sm font-medium text-gray-300" htmlFor="api-url">
              API Endpoint URL
            </Label>
            <Input 
              id="api-url"
              name="endpoint"
              className="mt-1 w-full bg-gray-800 border-gray-700 text-white"
              placeholder="https://api.example.com/v1/data"
              value={formData.endpoint}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium text-gray-300" htmlFor="auth-method">
              Authentication Method
            </Label>
            <Select 
              value={formData.authMethod} 
              onValueChange={(value) => handleSelectChange('authMethod', value)}
            >
              <SelectTrigger id="auth-method" className="mt-1 w-full bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Select authentication method" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                <SelectItem value="api-key">API Key</SelectItem>
                <SelectItem value="oauth">OAuth</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {formData.authMethod === 'api-key' && (
            <div>
              <Label className="text-sm font-medium text-gray-300" htmlFor="api-key">
                API Key
              </Label>
              <Input 
                id="api-key"
                name="apiKey"
                type="password"
                className="mt-1 w-full bg-gray-800 border-gray-700 text-white"
                placeholder="Enter API key"
                value={formData.apiKey}
                onChange={handleChange}
              />
              <p className="text-xs text-gray-400 mt-1">
                Leave empty to use environment variable
              </p>
            </div>
          )}
          
          <div>
            <Label className="text-sm font-medium text-gray-300" htmlFor="monthly-limit">
              Monthly Call Limit
            </Label>
            <Input 
              id="monthly-limit"
              name="monthlyLimit"
              type="number"
              className="mt-1 w-full bg-gray-800 border-gray-700 text-white"
              placeholder="1000"
              value={formData.monthlyLimit}
              onChange={handleChange}
            />
          </div>
          
          <div className="flex items-center">
            <Switch 
              id="active"
              checked={formData.active}
              onCheckedChange={handleSwitchChange}
              className="mr-2"
            />
            <Label htmlFor="active" className="text-sm text-gray-300">
              Activate immediately
            </Label>
          </div>
        </div>
        
        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            className="border-gray-700 text-white hover:bg-gray-700"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="bg-discord-blurple hover:bg-blue-600 text-white"
            onClick={handleSubmit}
            disabled={addIntegrationMutation.isPending}
          >
            Add Integration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddIntegrationModal;
