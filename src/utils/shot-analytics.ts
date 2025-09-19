import { Shot } from "@/types/shot";
import { Hole } from "@/types/golf";
import { Coordinates } from "@/types/golf";

export interface ShotStats {
  totalShots: number;
  averageDistance: number;
  accuracy: number;
  mostUsedClub: string;
  bestHole: number;
  worstHole: number;
}

export interface ClubPerformance {
  club: string;
  avgDistance: number;
  minDistance: number;
  maxDistance: number;
  accuracy: number;
  usage: number;
  consistency: number;
}

export interface HeatMapPoint {
  lat: number;
  lng: number;
  intensity: number;
  shotCount: number;
  avgDistance: number;
}

/**
 * Calculate comprehensive shot statistics
 */
export function calculateShotStats(shots: Shot[]): ShotStats {
  if (shots.length === 0) {
    return {
      totalShots: 0,
      averageDistance: 0,
      accuracy: 0,
      mostUsedClub: '',
      bestHole: 0,
      worstHole: 0
    };
  }

  const totalDistance = shots.reduce((sum, shot) => sum + shot.distance, 0);
  const averageDistance = Math.round(totalDistance / shots.length);

  // Calculate accuracy based on lie quality
  const accurateShots = shots.filter(shot => 
    shot.lie === 'fairway' || shot.lie === 'green'
  ).length;
  const accuracy = Math.round((accurateShots / shots.length) * 100);

  // Find most used club
  const clubUsage = shots.reduce((acc, shot) => {
    acc[shot.club] = (acc[shot.club] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const mostUsedClub = Object.entries(clubUsage)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

  // Calculate hole performance (simplified)
  const holePerformance = shots.reduce((acc, shot) => {
    if (!acc[shot.holeNumber]) {
      acc[shot.holeNumber] = { shots: 0, goodShots: 0 };
    }
    acc[shot.holeNumber].shots++;
    if (shot.lie === 'fairway' || shot.lie === 'green') {
      acc[shot.holeNumber].goodShots++;
    }
    return acc;
  }, {} as Record<number, { shots: number; goodShots: number }>);

  const holeScores = Object.entries(holePerformance).map(([hole, data]) => ({
    hole: parseInt(hole),
    score: data.goodShots / data.shots
  }));

  const bestHole = holeScores.sort((a, b) => b.score - a.score)[0]?.hole || 0;
  const worstHole = holeScores.sort((a, b) => a.score - b.score)[0]?.hole || 0;

  return {
    totalShots: shots.length,
    averageDistance,
    accuracy,
    mostUsedClub,
    bestHole,
    worstHole
  };
}

/**
 * Analyze club performance
 */
export function analyzeClubPerformance(shots: Shot[]): ClubPerformance[] {
  const clubGroups = shots.reduce((acc, shot) => {
    if (!acc[shot.club]) {
      acc[shot.club] = [];
    }
    acc[shot.club].push(shot);
    return acc;
  }, {} as Record<string, Shot[]>);

  return Object.entries(clubGroups).map(([club, clubShots]) => {
    const distances = clubShots.map(shot => shot.distance);
    const avgDistance = Math.round(distances.reduce((sum, d) => sum + d, 0) / distances.length);
    const minDistance = Math.min(...distances);
    const maxDistance = Math.max(...distances);

    // Calculate accuracy
    const accurateShots = clubShots.filter(shot => 
      shot.lie === 'fairway' || shot.lie === 'green'
    ).length;
    const accuracy = Math.round((accurateShots / clubShots.length) * 100);

    // Calculate consistency (lower standard deviation = higher consistency)
    const variance = distances.reduce((sum, d) => sum + Math.pow(d - avgDistance, 2), 0) / distances.length;
    const stdDev = Math.sqrt(variance);
    const consistency = Math.max(0, 100 - Math.round(stdDev / avgDistance * 100));

    return {
      club,
      avgDistance,
      minDistance,
      maxDistance,
      accuracy,
      usage: clubShots.length,
      consistency
    };
  }).sort((a, b) => b.usage - a.usage);
}

/**
 * Generate heat map data from shot locations
 */
export function generateHeatMapData(shots: Shot[], gridSize: number = 50): HeatMapPoint[] {
  if (shots.length === 0) return [];

  // Find bounds
  const lats = shots.map(shot => shot.coordinates.lat);
  const lngs = shots.map(shot => shot.coordinates.lng);
  
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const latStep = (maxLat - minLat) / gridSize;
  const lngStep = (maxLng - minLng) / gridSize;

  const heatMap: HeatMapPoint[] = [];

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const lat = minLat + i * latStep;
      const lng = minLng + j * lngStep;
      
      // Find shots within this grid cell
      const cellShots = shots.filter(shot => {
        return shot.coordinates.lat >= lat && 
               shot.coordinates.lat < lat + latStep &&
               shot.coordinates.lng >= lng && 
               shot.coordinates.lng < lng + lngStep;
      });

      if (cellShots.length > 0) {
        const avgDistance = cellShots.reduce((sum, shot) => sum + shot.distance, 0) / cellShots.length;
        
        heatMap.push({
          lat: lat + latStep / 2,
          lng: lng + lngStep / 2,
          intensity: cellShots.length,
          shotCount: cellShots.length,
          avgDistance: Math.round(avgDistance)
        });
      }
    }
  }

  return heatMap;
}

/**
 * Calculate shot pattern tendencies
 */
export function analyzeShotPatterns(shots: Shot[]) {
  const patterns = {
    preferredLies: {} as Record<string, number>,
    clubDistributionByLie: {} as Record<string, Record<string, number>>,
    distanceRanges: {
      short: shots.filter(s => s.distance < 100).length,
      medium: shots.filter(s => s.distance >= 100 && s.distance < 200).length,
      long: shots.filter(s => s.distance >= 200).length
    },
    shotSequencePatterns: [] as string[]
  };

  // Analyze preferred lies
  shots.forEach(shot => {
    patterns.preferredLies[shot.lie] = (patterns.preferredLies[shot.lie] || 0) + 1;
  });

  // Analyze club usage by lie
  shots.forEach(shot => {
    if (!patterns.clubDistributionByLie[shot.lie]) {
      patterns.clubDistributionByLie[shot.lie] = {};
    }
    patterns.clubDistributionByLie[shot.lie][shot.club] = 
      (patterns.clubDistributionByLie[shot.lie][shot.club] || 0) + 1;
  });

  return patterns;
}

/**
 * Calculate performance trends over time
 */
export function calculatePerformanceTrends(shots: Shot[], timeWindow: 'week' | 'month' | 'season' = 'week') {
  const now = new Date();
  const timeThresholds = {
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
    season: 90 * 24 * 60 * 60 * 1000
  };

  const threshold = timeThresholds[timeWindow];
  const recentShots = shots.filter(shot => {
    const shotDate = new Date(shot.timestamp);
    return now.getTime() - shotDate.getTime() <= threshold;
  });

  const previousShots = shots.filter(shot => {
    const shotDate = new Date(shot.timestamp);
    const timeDiff = now.getTime() - shotDate.getTime();
    return timeDiff > threshold && timeDiff <= threshold * 2;
  });

  const recentStats = calculateShotStats(recentShots);
  const previousStats = calculateShotStats(previousShots);

  return {
    recent: recentStats,
    previous: previousStats,
    trends: {
      accuracyChange: recentStats.accuracy - previousStats.accuracy,
      distanceChange: recentStats.averageDistance - previousStats.averageDistance,
      shotsChange: recentStats.totalShots - previousStats.totalShots
    }
  };
}