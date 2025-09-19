import React, { useMemo, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, ScatterChart, Scatter
} from 'recharts';
import { 
  TrendingUp, Target, MapPin, Award, 
  Activity, BarChart3, PieChart as PieChartIcon 
} from "lucide-react";
import { Shot } from "@/types/shot";
import { Hole } from "@/types/golf";

interface ShotAnalyticsProps {
  shots: Shot[];
  holes: Hole[];
  currentHole?: Hole;
}

interface ClubStats {
  club: string;
  avgDistance: number;
  accuracy: number;
  usage: number;
  shots: Shot[];
}

interface HolePerformance {
  holeNumber: number;
  par: number;
  avgShots: number;
  bestScore: number;
  worstScore: number;
  playedCount: number;
}

export function ShotAnalytics({ shots, holes, currentHole }: ShotAnalyticsProps) {
  const [selectedClub, setSelectedClub] = useState<string>('all');
  const [selectedHole, setSelectedHole] = useState<number | 'all'>('all');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'season' | 'all'>('all');

  // Filter shots based on selections
  const filteredShots = useMemo(() => {
    return shots.filter(shot => {
      if (selectedClub !== 'all' && shot.club !== selectedClub) return false;
      if (selectedHole !== 'all' && shot.holeNumber !== selectedHole) return false;
      // Add time range filtering logic here
      return true;
    });
  }, [shots, selectedClub, selectedHole, timeRange]);

  // Calculate club statistics
  const clubStats = useMemo((): ClubStats[] => {
    const clubMap = new Map<string, Shot[]>();
    
    filteredShots.forEach(shot => {
      if (!clubMap.has(shot.club)) {
        clubMap.set(shot.club, []);
      }
      clubMap.get(shot.club)!.push(shot);
    });

    return Array.from(clubMap.entries()).map(([club, clubShots]) => {
      const avgDistance = clubShots.reduce((sum, shot) => sum + shot.distance, 0) / clubShots.length;
      
      // Calculate accuracy based on lie after shot (simplified)
      const accurateShots = clubShots.filter(shot => 
        shot.lie === 'fairway' || shot.lie === 'green'
      ).length;
      const accuracy = (accurateShots / clubShots.length) * 100;

      return {
        club,
        avgDistance: Math.round(avgDistance),
        accuracy: Math.round(accuracy),
        usage: clubShots.length,
        shots: clubShots
      };
    }).sort((a, b) => b.usage - a.usage);
  }, [filteredShots]);

  // Calculate hole performance
  const holePerformance = useMemo((): HolePerformance[] => {
    const holeMap = new Map<number, Shot[]>();
    
    filteredShots.forEach(shot => {
      if (!holeMap.has(shot.holeNumber)) {
        holeMap.set(shot.holeNumber, []);
      }
      holeMap.get(shot.holeNumber)!.push(shot);
    });

    return Array.from(holeMap.entries()).map(([holeNumber, holeShots]) => {
      const hole = holes.find(h => h.holeNumber === holeNumber);
      if (!hole) return null;

      // Group shots by rounds (simplified - assume consecutive shots are same round)
      const rounds: Shot[][] = [];
      let currentRound: Shot[] = [];
      
      holeShots.forEach(shot => {
        if (shot.shotNumber === 1 && currentRound.length > 0) {
          rounds.push([...currentRound]);
          currentRound = [shot];
        } else {
          currentRound.push(shot);
        }
      });
      if (currentRound.length > 0) rounds.push(currentRound);

      const roundScores = rounds.map(round => round.length);
      const avgShots = roundScores.reduce((sum, score) => sum + score, 0) / roundScores.length;

      return {
        holeNumber,
        par: hole.par,
        avgShots: Math.round(avgShots * 10) / 10,
        bestScore: Math.min(...roundScores),
        worstScore: Math.max(...roundScores),
        playedCount: rounds.length
      };
    }).filter(Boolean) as HolePerformance[];
  }, [filteredShots, holes]);

  // Shot pattern data for scatter plot
  const shotPatternData = useMemo(() => {
    return filteredShots.map(shot => ({
      distance: shot.distance,
      accuracy: shot.lie === 'fairway' ? 100 : shot.lie === 'rough' ? 50 : 0,
      club: shot.club,
      holeNumber: shot.holeNumber
    }));
  }, [filteredShots]);

  // Lie distribution data
  const lieDistribution = useMemo(() => {
    const lieCount = filteredShots.reduce((acc, shot) => {
      acc[shot.lie] = (acc[shot.lie] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(lieCount).map(([lie, count]) => ({
      name: lie.charAt(0).toUpperCase() + lie.slice(1),
      value: count,
      percentage: Math.round((count / filteredShots.length) * 100)
    }));
  }, [filteredShots]);

  const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  const allClubs = Array.from(new Set(shots.map(s => s.club))).sort();

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Shot Analytics
          </h3>
          <Badge variant="outline">{filteredShots.length} shots analyzed</Badge>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">Club</label>
            <Select value={selectedClub} onValueChange={setSelectedClub}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clubs</SelectItem>
                {allClubs.map(club => (
                  <SelectItem key={club} value={club}>{club}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Hole</label>
            <Select value={selectedHole.toString()} onValueChange={(value) => setSelectedHole(value === 'all' ? 'all' : parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Holes</SelectItem>
                {holes.map(hole => (
                  <SelectItem key={hole.holeNumber} value={hole.holeNumber.toString()}>
                    Hole {hole.holeNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Time Range</label>
            <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="season">This Season</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button variant="outline" size="sm" className="w-full">
              <Activity className="w-4 h-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="clubs">Club Analysis</TabsTrigger>
          <TabsTrigger value="holes">Hole Performance</TabsTrigger>
          <TabsTrigger value="patterns">Shot Patterns</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <Target className="w-8 h-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{filteredShots.length}</div>
              <div className="text-sm text-muted-foreground">Total Shots</div>
            </Card>
            
            <Card className="p-4 text-center">
              <Award className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">
                {Math.round((filteredShots.filter(s => s.lie === 'fairway' || s.lie === 'green').length / filteredShots.length) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Accuracy</div>
            </Card>
            
            <Card className="p-4 text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">
                {Math.round(filteredShots.reduce((sum, shot) => sum + shot.distance, 0) / filteredShots.length)}
              </div>
              <div className="text-sm text-muted-foreground">Avg Distance</div>
            </Card>
            
            <Card className="p-4 text-center">
              <MapPin className="w-8 h-8 mx-auto mb-2 text-orange-500" />
              <div className="text-2xl font-bold">{allClubs.length}</div>
              <div className="text-sm text-muted-foreground">Clubs Used</div>
            </Card>
          </div>

          <Card className="p-4">
            <h4 className="font-medium mb-4">Shot Distribution by Lie</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={lieDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {lieDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="clubs" className="space-y-4">
          <Card className="p-4">
            <h4 className="font-medium mb-4">Club Performance</h4>
            <div className="space-y-4">
              {clubStats.map((stat) => (
                <div key={stat.club} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{stat.club}</span>
                    <div className="flex items-center gap-4 text-sm">
                      <span>{stat.avgDistance} yds avg</span>
                      <span>{stat.accuracy}% accuracy</span>
                      <Badge variant="outline">{stat.usage} shots</Badge>
                    </div>
                  </div>
                  <Progress value={stat.accuracy} className="h-2" />
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-medium mb-4">Distance by Club</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clubStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="club" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="avgDistance" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="holes" className="space-y-4">
          <Card className="p-4">
            <h4 className="font-medium mb-4">Hole Performance vs Par</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={holePerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="holeNumber" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="par" fill="#22c55e" name="Par" />
                  <Bar dataKey="avgShots" fill="#3b82f6" name="Avg Shots" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-medium mb-4">Hole Statistics</h4>
            <div className="space-y-2">
              {holePerformance.map((perf) => (
                <div key={perf.holeNumber} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">Hole {perf.holeNumber}</Badge>
                    <span className="text-sm">Par {perf.par}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span>Avg: {perf.avgShots}</span>
                    <span>Best: {perf.bestScore}</span>
                    <span>Played: {perf.playedCount}x</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <Card className="p-4">
            <h4 className="font-medium mb-4">Shot Distance vs Accuracy</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart data={shotPatternData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="distance" name="Distance" unit=" yds" />
                  <YAxis dataKey="accuracy" name="Accuracy" unit="%" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Shots" dataKey="accuracy" fill="#3b82f6" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card className="p-4">
            <h4 className="font-medium mb-4">Performance Trends</h4>
            <div className="text-center py-8">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Trend analysis would be implemented with time-series data
              </p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}