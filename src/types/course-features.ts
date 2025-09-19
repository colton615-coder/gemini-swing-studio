import { Coordinates } from "./golf";

export interface CourseFeature {
  id: string;
  type: 'fairway' | 'rough' | 'sand' | 'water' | 'green' | 'tee' | 'cart-path' | 'tree' | 'building';
  name?: string;
  coordinates: Coordinates[];
  holeNumber: number;
  elevation?: number;
  difficulty?: 'easy' | 'moderate' | 'hard';
  notes?: string;
}

export interface HoleElevation {
  holeNumber: number;
  elevationPoints: {
    coordinates: Coordinates;
    elevation: number; // in feet
    distanceFromTee: number; // in yards
  }[];
  totalElevationChange: number;
  slope: number; // degrees
}

export interface PinPosition {
  holeNumber: number;
  date: string;
  coordinates: Coordinates;
  difficulty: 'front' | 'middle' | 'back';
  notes?: string;
}

export interface WeatherCondition {
  temperature: number; // Fahrenheit
  windSpeed: number; // mph
  windDirection: number; // degrees (0-360)
  humidity: number; // percentage
  pressure: number; // inches of mercury
  timestamp: string;
}

export interface CourseCondition {
  date: string;
  greensSpeed: number; // stimpmeter reading
  fairwayFirmness: 'soft' | 'medium' | 'firm';
  roughHeight: number; // inches
  weather: WeatherCondition;
  notes?: string;
}