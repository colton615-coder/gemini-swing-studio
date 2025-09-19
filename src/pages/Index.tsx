import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, BarChart3, Trophy, MapPin, Navigation } from "lucide-react";
import { ScoreCard } from "@/components/golf/ScoreCard";
import { GPS } from "@/components/golf/GPS";
import { courses } from "@/data/courses";
import { Course, ScoreEntry, Round } from "@/types/golf";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [selectedCourse, setSelectedCourse] = useState<Course>(courses[0]);
  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [currentHole, setCurrentHole] = useState(1);
  const { toast } = useToast();

  const startNewRound = () => {
    const newRound: Round = {
      id: Date.now().toString(),
      courseId: selectedCourse.name,
      courseName: selectedCourse.name,
      date: new Date().toISOString(),
      scores: selectedCourse.holes.map(hole => ({
        holeNumber: hole.holeNumber,
        par: hole.par
      }))
    };
    
    setCurrentRound(newRound);
    setCurrentHole(1);
    
    toast({
      title: "New Round Started",
      description: `Playing ${selectedCourse.name} - Good luck!`
    });
  };

  const updateScore = (holeNumber: number, updates: Partial<ScoreEntry>) => {
    if (!currentRound) return;
    
    const updatedScores = currentRound.scores.map(score =>
      score.holeNumber === holeNumber ? { ...score, ...updates } : score
    );
    
    setCurrentRound({
      ...currentRound,
      scores: updatedScores
    });
  };

  const getCurrentHoleData = () => {
    return selectedCourse.holes.find(hole => hole.holeNumber === currentHole);
  };

  const nextHole = () => {
    if (currentHole < selectedCourse.holes.length) {
      setCurrentHole(currentHole + 1);
    }
  };

  const prevHole = () => {
    if (currentHole > 1) {
      setCurrentHole(currentHole - 1);
    }
  };

  if (!currentRound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              GeminiGolf Pro
            </h1>
            <p className="text-xl text-muted-foreground">Professional Golf Tracking & GPS</p>
          </div>

          {/* Course Selection */}
          <Card className="max-w-md mx-auto mb-8 p-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-2">Select Course</label>
                <Select
                  value={selectedCourse.name}
                  onValueChange={(value) => {
                    const course = courses.find(c => c.name === value);
                    if (course) setSelectedCourse(course);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.name} value={course.name}>
                        <div>
                          <div className="font-medium">{course.name}</div>
                          <div className="text-sm text-muted-foreground">{course.location}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="font-medium">{selectedCourse.name}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{selectedCourse.location}</p>
                <Badge variant="outline">{selectedCourse.holes.length} Holes</Badge>
              </div>

              <Button onClick={startNewRound} className="w-full" size="lg">
                <Play className="w-5 h-5 mr-2" />
                Start New Round
              </Button>
            </div>
          </Card>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-3 max-w-2xl mx-auto">
            <Card className="p-4 text-center hover:shadow-lg transition-shadow">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold mb-1">Track Stats</h3>
              <p className="text-sm text-muted-foreground">Detailed scoring analytics</p>
            </Card>

            <Card className="p-4 text-center hover:shadow-lg transition-shadow">
              <Navigation className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold mb-1">GPS Distances</h3>
              <p className="text-sm text-muted-foreground">Real-time yardages</p>
            </Card>

            <Card className="p-4 text-center hover:shadow-lg transition-shadow">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold mb-1">Handicap</h3>
              <p className="text-sm text-muted-foreground">Track improvement</p>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{currentRound.courseName}</h1>
            <p className="text-muted-foreground">
              {new Date(currentRound.date).toLocaleDateString()}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setCurrentRound(null)}
          >
            End Round
          </Button>
        </div>

        <Tabs defaultValue="scorecard" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scorecard">Scorecard</TabsTrigger>
            <TabsTrigger value="gps">GPS</TabsTrigger>
          </TabsList>

          <TabsContent value="scorecard" className="space-y-4">
            {/* Hole Navigation */}
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={prevHole}
                  disabled={currentHole === 1}
                >
                  Previous
                </Button>
                
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Current Hole</p>
                  <p className="text-2xl font-bold">{currentHole}</p>
                </div>
                
                <Button
                  variant="outline"
                  onClick={nextHole}
                  disabled={currentHole === selectedCourse.holes.length}
                >
                  Next
                </Button>
              </div>
            </Card>

            <ScoreCard
              holes={currentRound.scores}
              onScoreUpdate={updateScore}
              currentHole={currentHole}
            />
          </TabsContent>

          <TabsContent value="gps">
            <GPS currentHole={getCurrentHoleData()} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
