import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ApiKeySettings() {
  const [googleMapsKey, setGoogleMapsKey] = useState(
    localStorage.getItem('google-maps-api-key') || ''
  );
  const [weatherKey, setWeatherKey] = useState(
    localStorage.getItem('weather-api-key') || ''
  );
  const { toast } = useToast();

  const saveGoogleMapsKey = () => {
    if (googleMapsKey.trim()) {
      localStorage.setItem('google-maps-api-key', googleMapsKey.trim());
      toast({
        title: "Google Maps API Key Saved",
        description: "Your API key has been saved locally."
      });
    }
  };

  const saveWeatherKey = () => {
    if (weatherKey.trim()) {
      localStorage.setItem('weather-api-key', weatherKey.trim());
      toast({
        title: "Weather API Key Saved", 
        description: "Your API key has been saved locally."
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Key className="w-5 h-5" />
            <span>Google Maps API Key</span>
          </CardTitle>
          <CardDescription>
            Required for satellite imagery and enhanced map features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              <div className="space-y-2">
                <p>To get your Google Maps API key:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">Google Cloud Console</a></li>
                  <li>Create a new project or select existing one</li>
                  <li>Enable Maps JavaScript API</li>
                  <li>Go to Credentials → Create Credentials → API Key</li>
                  <li>Restrict the key to Maps JavaScript API</li>
                </ol>
              </div>
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <Label htmlFor="google-maps-key">API Key</Label>
            <div className="flex space-x-2">
              <Input
                id="google-maps-key"
                type="password"
                placeholder="AIzaSy..."
                value={googleMapsKey}
                onChange={(e) => setGoogleMapsKey(e.target.value)}
              />
              <Button onClick={saveGoogleMapsKey} disabled={!googleMapsKey.trim()}>
                Save
              </Button>
            </div>
          </div>

          <Button variant="outline" size="sm" asChild>
            <a
              href="https://developers.google.com/maps/documentation/javascript/get-api-key"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Get API Key Guide</span>
            </a>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weather API Key (Optional)</CardTitle>
          <CardDescription>
            For real-time weather and wind conditions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Get a free API key from <a href="https://openweathermap.org/api" target="_blank" rel="noopener noreferrer" className="text-primary underline">OpenWeatherMap</a>
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <Label htmlFor="weather-key">API Key</Label>
            <div className="flex space-x-2">
              <Input
                id="weather-key"
                type="password"
                placeholder="Your OpenWeather API key"
                value={weatherKey}
                onChange={(e) => setWeatherKey(e.target.value)}
              />
              <Button onClick={saveWeatherKey} disabled={!weatherKey.trim()}>
                Save
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}