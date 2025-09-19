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
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-accent/20 animate-pulse opacity-50" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary/30 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-accent/30 to-transparent rounded-full blur-3xl" />
        
        <div className="relative z-10 container mx-auto px-4 py-12">
          {/* Hero Header */}
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-6 py-3 mb-8">
              <Trophy className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Professional Golf Course Selection</span>
            </div>
            <h1 className="text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent leading-tight">
              Choose Your<br />Perfect Course
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Select from {courses.length} premier New York public golf courses and start your professional golf experience
            </p>
          </div>

          {/* Main Course Selection Card */}
          <div className="max-w-4xl mx-auto mb-12">
            <Card className="p-12 shadow-2xl border-0 bg-white/95 backdrop-blur-sm hover:shadow-3xl transition-all duration-500 hover:scale-[1.02]">
              <div className="text-center mb-10">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <MapPin className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold mb-2">Select Your Course</h2>
                <p className="text-muted-foreground text-lg">Choose from the finest public courses in New York</p>
              </div>

              <div className="space-y-8">
                <div className="max-w-md mx-auto">
                  <Select
                    value={selectedCourse.name}
                    onValueChange={(value) => {
                      const course = courses.find(c => c.name === value);
                      if (course) setSelectedCourse(course);
                    }}
                  >
                    <SelectTrigger className="h-14 text-lg border-2 hover:border-primary/50 transition-colors">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-80">
                      {courses.map((course) => (
                        <SelectItem key={course.name} value={course.name} className="p-4">
                          <div className="text-left">
                            <div className="font-semibold text-base">{course.name}</div>
                            <div className="text-sm text-muted-foreground">{course.location}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Selected Course Details */}
                <div className="bg-gradient-to-r from-primary/5 via-transparent to-accent/5 rounded-2xl p-8 border border-primary/10">
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                          <Navigation className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold">{selectedCourse.name}</h3>
                          <p className="text-muted-foreground">{selectedCourse.location}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="text-center p-4 bg-white/50 rounded-xl">
                          <div className="text-2xl font-bold text-primary">{selectedCourse.holes.length}</div>
                          <div className="text-sm text-muted-foreground">Holes</div>
                        </div>
                        <div className="text-center p-4 bg-white/50 rounded-xl">
                          <div className="text-2xl font-bold text-accent">
                            {selectedCourse.holes.reduce((sum, hole) => sum + hole.par, 0)}
                          </div>
                          <div className="text-sm text-muted-foreground">Total Par</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col justify-center">
                      <Button 
                        onClick={startNewRound} 
                        size="lg" 
                        className="h-16 text-lg bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                      >
                        <Play className="w-6 h-6 mr-3" />
                        Start Your Round
                      </Button>
                      <p className="text-center text-sm text-muted-foreground mt-3">
                        Begin professional golf tracking with GPS precision
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="max-w-3xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6 text-center bg-white/80 backdrop-blur-sm border-0 hover:bg-white/90 transition-all duration-300 hover:scale-105">
                <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">Precision Tracking</h3>
                <p className="text-sm text-muted-foreground">Advanced shot analysis and GPS mapping</p>
              </Card>

              <Card className="p-6 text-center bg-white/80 backdrop-blur-sm border-0 hover:bg-white/90 transition-all duration-300 hover:scale-105">
                <div className="w-12 h-12 bg-gradient-to-br from-accent/20 to-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-bold text-lg mb-2">Performance Analytics</h3>
                <p className="text-sm text-muted-foreground">Detailed scoring and improvement insights</p>
              </Card>

              <Card className="p-6 text-center bg-white/80 backdrop-blur-sm border-0 hover:bg-white/90 transition-all duration-300 hover:scale-105">
                <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">Professional Grade</h3>
                <p className="text-sm text-muted-foreground">Tournament-level course data and tools</p>
              </Card>
            </div>
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
