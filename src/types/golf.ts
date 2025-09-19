export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Hole {
  holeNumber: number;
  par: number;
  teeCoords: Coordinates;
  greenCoords: Coordinates;
  distance?: number;
}

export interface Course {
  name: string;
  location: string;
  holes: Hole[];
}

export interface ScoreEntry {
  holeNumber: number;
  par: number;
  score?: number;
  putts?: number;
  fairwayHit?: boolean;
  greenInRegulation?: boolean;
}

export interface Round {
  id: string;
  courseId: string;
  courseName: string;
  date: string;
  scores: ScoreEntry[];
}