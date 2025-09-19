export interface Coordinates {
  lat: number;
  lng: number;
}

export interface TeeBox {
  name: string; // e.g., "Black", "Blue", "White", "Red"
  color: string;
  coords: Coordinates;
  yardage: number;
  rating: number; // Course rating from this tee
  slope: number; // Slope rating from this tee
}

export interface Hole {
  holeNumber: number;
  par: number;
  teeBoxes?: TeeBox[]; // Optional for backward compatibility
  teeCoords?: Coordinates; // Keep for backward compatibility
  greenCoords: Coordinates;
  distance?: number; // Keep for backward compatibility
  handicap?: number; // Stroke index (1-18)
  dogleg?: 'left' | 'right' | 'none';
  hazards?: string[]; // e.g., ["water", "bunker", "trees"]
}

export interface Course {
  name: string;
  location: string;
  architect?: string;
  yearBuilt?: number;
  holes: Hole[];
  phoneNumber?: string;
  website?: string;
  photos?: {
    hero: string; // Main course image
    clubhouse?: string;
    holes?: string[]; // Individual hole photos
  };
  amenities?: string[]; // e.g., ["pro shop", "restaurant", "driving range"]
  greenFees?: {
    weekday: number;
    weekend: number;
    twilight?: number;
  };
  description?: string;
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