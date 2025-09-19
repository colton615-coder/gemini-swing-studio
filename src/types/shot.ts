import { Coordinates } from "./golf";

export interface Shot {
  id: string;
  holeNumber: number;
  shotNumber: number;
  coordinates: Coordinates;
  club: string;
  distance: number;
  lie: 'fairway' | 'rough' | 'sand' | 'green' | 'tee';
  timestamp: string;
}

export interface ShotTrackingRound {
  id: string;
  courseId: string;
  courseName: string;
  date: string;
  shots: Shot[];
}