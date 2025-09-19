import { WeatherCondition } from '@/types/course-features';

const WEATHER_API_KEY = 'your-weather-api-key'; // Users can input this in settings
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';

export interface WeatherData {
  temperature: number;
  windSpeed: number;
  windDirection: number;
  humidity: number;
  pressure: number;
  description: string;
  icon: string;
}

export class WeatherService {
  private static apiKey: string | null = null;

  static setApiKey(key: string) {
    this.apiKey = key;
    localStorage.setItem('weather-api-key', key);
  }

  static getApiKey(): string | null {
    if (!this.apiKey) {
      this.apiKey = localStorage.getItem('weather-api-key');
    }
    return this.apiKey;
  }

  static async getCurrentWeather(lat: number, lng: number): Promise<WeatherData | null> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Weather API key not configured');
    }

    try {
      const response = await fetch(
        `${WEATHER_API_URL}?lat=${lat}&lon=${lng}&appid=${apiKey}&units=imperial`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }

      const data = await response.json();
      
      return {
        temperature: Math.round(data.main.temp),
        windSpeed: Math.round(data.wind.speed),
        windDirection: data.wind.deg || 0,
        humidity: data.main.humidity,
        pressure: data.main.pressure * 0.02953, // Convert hPa to inHg
        description: data.weather[0].description,
        icon: data.weather[0].icon
      };
    } catch (error) {
      console.error('Weather service error:', error);
      return null;
    }
  }

  static async getWeatherCondition(lat: number, lng: number): Promise<WeatherCondition | null> {
    const weather = await this.getCurrentWeather(lat, lng);
    if (!weather) return null;

    return {
      temperature: weather.temperature,
      windSpeed: weather.windSpeed,
      windDirection: weather.windDirection,
      humidity: weather.humidity,
      pressure: weather.pressure,
      timestamp: new Date().toISOString()
    };
  }
}