import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, BarChart3, Trophy, MapPin, Navigation, Download, Target, Search, Filter, Clock, Calendar, Trash2 } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [pastRounds, setPastRounds] = useState<Round[]>([]);
  const { toast } = useToast();

  // Load past rounds from localStorage
  useEffect(() => {
    const savedRounds = localStorage.getItem('golfRounds');
    if (savedRounds) {
      setPastRounds(JSON.parse(savedRounds));
    }
  }, []);

  // Save rounds to localStorage
  const saveRounds = (rounds: Round[]) => {
    localStorage.setItem('golfRounds', JSON.stringify(rounds));
    setPastRounds(rounds);
  };

  // Filter courses based on search and location
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLocation = locationFilter === 'all' || 
                           course.location.toLowerCase().includes(locationFilter.toLowerCase());
    
    return matchesSearch && matchesLocation;
  });

  // Get unique locations for filter
  const locations = ['all', ...Array.from(new Set(courses.map(course => {
    const parts = course.location.split(', ');
    return parts[parts.length - 1]; // Get the state/region part
  })))];

  // Group courses by region for better organization
  const groupedCourses = filteredCourses.reduce((acc, course) => {
    const region = course.location.includes('Manhattan') || course.location.includes('Brooklyn') || 
                  course.location.includes('Queens') || course.location.includes('Bronx') || 
                  course.location.includes('Staten Island') ? 'NYC' :
                  course.location.includes('Long Island') || course.location.includes('Farmingdale') ||
                  course.location.includes('Nassau') || course.location.includes('Suffolk') ? 'Long Island' :
                  course.location.includes('Westchester') || course.location.includes('Hudson Valley') ? 'Westchester/Hudson Valley' :
                  course.location.includes('Buffalo') || course.location.includes('Rochester') || 
                  course.location.includes('Niagara') ? 'Western NY' :
                  course.location.includes('Syracuse') || course.location.includes('Central') ? 'Central NY' :
                  'Upstate NY';
    
    if (!acc[region]) acc[region] = [];
    acc[region].push(course);
    return acc;
  }, {} as Record<string, Course[]>);

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
    if (currentRound) {
      const updatedRounds = [...pastRounds, currentRound];
      saveRounds(updatedRounds);
    }
    
    setCurrentRound(null);
    setShotTrackingRound(null);
    setActiveView('home');
    toast({
      title: "Round Completed! 🏌️",
      description: "Great game! Your round has been saved."
    });
  };

  const deleteRound = (roundId: string) => {
    const updatedRounds = pastRounds.filter(round => round.id !== roundId);
    saveRounds(updatedRounds);
    toast({
      title: "Round Deleted",
      description: "Round has been removed from your history."
    });
  };

  const loadPastRound = (round: Round) => {
    setCurrentRound(round);
    const course = courses.find(c => c.name === round.courseId) || courses[0];
    setSelectedCourse(course);
    setActiveView('play');
    
    const newShotRound: ShotTrackingRound = {
      id: Date.now().toString(),
      courseId: round.courseId,
      courseName: round.courseName,
      date: new Date().toISOString(),
      shots: []
    };
    setShotTrackingRound(newShotRound);
    
    toast({
      title: "Round Loaded",
      description: `Viewing round from ${new Date(round.date).toLocaleDateString()}`
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
                {/* Search and Filter Section */}
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <Input
                      placeholder="Search courses by name or location..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-14 text-lg border-2 hover:border-primary/50 transition-colors"
                    />
                  </div>
                  
                  <div className="flex gap-4 items-center">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Filter by region:</span>
                    </div>
                    <Select value={locationFilter} onValueChange={setLocationFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Regions</SelectItem>
                        <SelectItem value="nyc">NYC</SelectItem>
                        <SelectItem value="long island">Long Island</SelectItem>
                        <SelectItem value="westchester">Westchester</SelectItem>
                        <SelectItem value="upstate">Upstate</SelectItem>
                        <SelectItem value="western">Western NY</SelectItem>
                        <SelectItem value="central">Central NY</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="text-center">
                    <Badge variant="outline" className="text-sm">
                      {filteredCourses.length} of {courses.length} courses found
                    </Badge>
                  </div>
                </div>

                {/* Course Selection */}
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
                      {Object.entries(groupedCourses).map(([region, regionCourses]) => (
                        <div key={region}>
                          <div className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted/50">
                            {region} ({regionCourses.length})
                          </div>
                          {regionCourses.map((course) => (
                            <SelectItem key={course.name} value={course.name} className="p-4">
                              <div className="text-left">
                                <div className="font-semibold text-base">{course.name}</div>
                                <div className="text-sm text-muted-foreground">{course.location}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {course.holes.length} holes • Par {course.holes.reduce((sum, hole) => sum + hole.par, 0)}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </div>
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

          {/* Past Rounds Section */}
          {pastRounds.length > 0 && (
            <div className="max-w-4xl mx-auto mt-16">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">Your Golf History</h2>
                <p className="text-muted-foreground">Review and analyze your past rounds</p>
              </div>
              
              <Card className="p-8 bg-white/80 backdrop-blur-sm border-0">
                <div className="grid gap-4">
                  {pastRounds.slice(-5).reverse().map((round) => {
                    const totalScore = round.scores.reduce((sum, score) => sum + (score.score || 0), 0);
                    const totalPar = round.scores.reduce((sum, score) => sum + score.par, 0);
                    const scoreToPar = totalScore - totalPar;
                    const completedHoles = round.scores.filter(score => score.score && score.score > 0).length;
                    
                    return (
                      <div key={round.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl border border-primary/10 hover:border-primary/20 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-bold text-lg">{round.courseName}</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(round.date).toLocaleDateString()} • {completedHoles}/{round.scores.length} holes
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">{totalScore > 0 ? totalScore : '-'}</div>
                            <div className="text-sm text-muted-foreground">
                              {totalScore > 0 ? (scoreToPar > 0 ? `+${scoreToPar}` : scoreToPar === 0 ? 'E' : scoreToPar) : 'In Progress'}
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => loadPastRound(round)}
                              className="hover:bg-primary/10"
                            >
                              <Clock className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="outline" 
                              size="sm"
                              onClick={() => deleteRound(round.id)}
                              className="hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {pastRounds.length > 5 && (
                  <div className="text-center mt-6">
                    <Badge variant="outline" className="text-sm">
                      Showing 5 most recent rounds • {pastRounds.length} total rounds played
                    </Badge>
                  </div>
                )}
              </Card>
            </div>
          )}
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
