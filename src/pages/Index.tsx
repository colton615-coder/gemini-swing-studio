import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, BarChart3, Trophy, MapPin, Navigation, Download, Target } from "lucide-react";
import { ScoreCard } from "@/components/golf/ScoreCard";
import { GPS } from "@/components/golf/GPS";
import { ShotTrackingMap } from "@/components/golf/ShotTrackingMap";
import { CourseDownloader } from "@/components/golf/CourseDownloader";
import { courses } from "@/data/courses";
import { Course, ScoreEntry, Round } from "@/types/golf";
import { Shot, ShotTrackingRound } from "@/types/shot";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [selectedCourse, setSelectedCourse] = useState<Course>(courses[0]);
  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [currentHole, setCurrentHole] = useState(1);
  const [shotTrackingRound, setShotTrackingRound] = useState<ShotTrackingRound | null>(null);
  const [activeView, setActiveView] = useState<'home' | 'courses' | 'play'>('home');
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
    
    const newShotRound: ShotTrackingRound = {
      id: Date.now().toString(),
      courseId: selectedCourse.name,
      courseName: selectedCourse.name,
      date: new Date().toISOString(),
      shots: []
    };
    
    setCurrentRound(newRound);
    setShotTrackingRound(newShotRound);
    setCurrentHole(1);
    setActiveView('play');
    
    toast({
      title: "New Round Started! 🏌️",
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

  const addShot = (shot: Omit<Shot, 'id' | 'timestamp'>) => {
    if (!shotTrackingRound) return;
    
    const newShot: Shot = {
      ...shot,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };
    
    setShotTrackingRound({
      ...shotTrackingRound,
      shots: [...shotTrackingRound.shots, newShot]
    });
  };

  const deleteShot = (shotId: string) => {
    if (!shotTrackingRound) return;
    
    setShotTrackingRound({
      ...shotTrackingRound,
      shots: shotTrackingRound.shots.filter(shot => shot.id !== shotId)
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

  const endRound = () => {
    setCurrentRound(null);
    setShotTrackingRound(null);
    setActiveView('home');
    toast({
      title: "Round Complete! 🎉",
      description: "Great round! Your scores have been saved."
    });
  };

  if (activeView === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-fade-in">
              GeminiGolf Pro
            </h1>
            <p className="text-xl text-muted-foreground">Professional Golf Tracking & GPS</p>
            <Badge variant="outline" className="mt-2">
              {courses.length} NY Public Courses Available
            </Badge>
          </div>

          {/* Main Actions */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto mb-8">
            <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer" onClick={() => setActiveView('courses')}>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Download className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Browse NY Courses</h3>
                <p className="text-muted-foreground">
                  Download data for all {courses.length} public golf courses in New York
                </p>
                <Button className="w-full">
                  View Courses
                </Button>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Play className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Quick Round</h3>
                <p className="text-muted-foreground">
                  Start playing {selectedCourse.name} with GPS tracking
                </p>
                <Button onClick={startNewRound} className="w-full">
                  Start Round
                </Button>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Target className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Shot Tracking</h3>
                <p className="text-muted-foreground">
                  Interactive maps with precise shot tracking
                </p>
                <Button variant="outline" className="w-full">
                  Learn More
                </Button>
              </div>
            </Card>
          </div>

          {/* Course Selection */}
          <Card className="max-w-md mx-auto mb-8 p-6 shadow-lg">
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

              <div className="p-4 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="font-medium">{selectedCourse.name}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{selectedCourse.location}</p>
                <div className="flex gap-2">
                  <Badge variant="outline">{selectedCourse.holes.length} Holes</Badge>
                  <Badge variant="outline">Par {selectedCourse.holes.reduce((sum, hole) => sum + hole.par, 0)}</Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Features */}
          <div className="grid gap-4 md:grid-cols-3 max-w-3xl mx-auto">
            <Card className="p-4 text-center hover:shadow-lg transition-shadow">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold mb-1">Advanced Analytics</h3>
              <p className="text-sm text-muted-foreground">Detailed scoring and performance tracking</p>
            </Card>

            <Card className="p-4 text-center hover:shadow-lg transition-shadow">
              <Navigation className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold mb-1">GPS Precision</h3>
              <p className="text-sm text-muted-foreground">Real-time yardages and distances</p>
            </Card>

            <Card className="p-4 text-center hover:shadow-lg transition-shadow">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold mb-1">Handicap Tracking</h3>
              <p className="text-sm text-muted-foreground">Monitor your improvement over time</p>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (activeView === 'courses') {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">NY Public Golf Courses</h1>
              <p className="text-muted-foreground">Browse and download course data</p>
            </div>
            <Button variant="outline" onClick={() => setActiveView('home')}>
              Back to Home
            </Button>
          </div>

          <CourseDownloader 
            onCourseSelect={(course) => {
              setSelectedCourse(course);
              setActiveView('home');
              toast({
                title: "Course Selected",
                description: `${course.name} is now your active course`
              });
            }}
          />
        </div>
      </div>
    );
  }

  // Playing view
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{currentRound?.courseName}</h1>
            <p className="text-muted-foreground">
              {currentRound && new Date(currentRound.date).toLocaleDateString()}
            </p>
          </div>
          <Button variant="outline" onClick={endRound}>
            End Round
          </Button>
        </div>

        <Tabs defaultValue="scorecard" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="scorecard">Scorecard</TabsTrigger>
            <TabsTrigger value="gps">GPS</TabsTrigger>
            <TabsTrigger value="shots">Shot Tracking</TabsTrigger>
          </TabsList>

          <TabsContent value="scorecard" className="space-y-4">
            {/* Hole Navigation */}
            <Card className="p-4 bg-gradient-to-r from-primary/5 to-accent/5">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={prevHole}
                  disabled={currentHole === 1}
                  className="hover:scale-105 transition-transform"
                >
                  Previous
                </Button>
                
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Current Hole</p>
                  <div className="flex items-center gap-2">
                    <p className="text-3xl font-bold">{currentHole}</p>
                    <Badge variant="outline">
                      Par {getCurrentHoleData()?.par}
                    </Badge>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  onClick={nextHole}
                  disabled={currentHole === selectedCourse.holes.length}
                  className="hover:scale-105 transition-transform"
                >
                  Next
                </Button>
              </div>
            </Card>

            {currentRound && (
              <ScoreCard
                holes={currentRound.scores}
                onScoreUpdate={updateScore}
                currentHole={currentHole}
              />
            )}
          </TabsContent>

          <TabsContent value="gps">
            <GPS currentHole={getCurrentHoleData()} />
          </TabsContent>

          <TabsContent value="shots">
            <ShotTrackingMap
              currentHole={getCurrentHoleData()}
              shots={shotTrackingRound?.shots || []}
              onShotAdd={addShot}
              onShotDelete={deleteShot}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
