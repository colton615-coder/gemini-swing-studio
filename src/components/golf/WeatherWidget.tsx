import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { WeatherService, WeatherData } from '@/services/weather';
import { Coordinates } from '@/types/golf';
import { Cloud, Wind, Droplets, Thermometer, Settings, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface WeatherWidgetProps {
  courseLocation?: Coordinates;
}

export const WeatherWidget = ({ courseLocation }: WeatherWidgetProps) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(WeatherService.getApiKey() || '');
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);

  const fetchWeather = async () => {
    if (!courseLocation || !WeatherService.getApiKey()) return;

    setLoading(true);
    try {
      const weatherData = await WeatherService.getCurrentWeather(
        courseLocation.lat,
        courseLocation.lng
      );
      setWeather(weatherData);
    } catch (error) {
      toast.error('Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  const handleApiKeySubmit = () => {
    if (apiKey.trim()) {
      WeatherService.setApiKey(apiKey.trim());
      setShowApiKeyDialog(false);
      toast.success('Weather API key saved');
      fetchWeather();
    }
  };

  useEffect(() => {
    if (courseLocation && WeatherService.getApiKey()) {
      fetchWeather();
    }
  }, [courseLocation]);

  const getWindDirection = (degrees: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.round(degrees / 45) % 8];
  };

  if (!WeatherService.getApiKey()) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Weather
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Configure your weather API key to see current conditions
          </div>
          <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configure Weather
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Weather API Configuration</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="apiKey">OpenWeatherMap API Key</Label>
                  <Input
                    id="apiKey"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your API key"
                    type="password"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Get your free API key from{' '}
                    <a 
                      href="https://openweathermap.org/api" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      OpenWeatherMap
                    </a>
                  </p>
                </div>
                <Button onClick={handleApiKeySubmit} className="w-full">
                  Save API Key
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Weather
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchWeather}
            disabled={loading || !courseLocation}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading weather...</div>
        ) : weather ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-orange-500" />
              <span className="font-medium">{weather.temperature}°F</span>
            </div>
            <div className="flex items-center gap-2">
              <Wind className="h-4 w-4 text-blue-500" />
              <span className="text-sm">
                {weather.windSpeed} mph {getWindDirection(weather.windDirection)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-blue-400" />
              <span className="text-sm">{weather.humidity}%</span>
            </div>
            <div className="text-sm text-muted-foreground capitalize">
              {weather.description}
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            {courseLocation ? 'Failed to load weather' : 'Select a course to see weather'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};