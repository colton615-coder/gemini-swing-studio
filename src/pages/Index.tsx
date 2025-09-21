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
import { BlueGolfMap } from "@/components/golf/BlueGolfMap";
import { CourseDownloader } from "@/components/golf/CourseDownloader";
import { WeatherWidget } from "@/components/golf/WeatherWidget";
import { PhotoAttachment } from "@/components/golf/PhotoAttachment";
import { OfflineIndicator } from "@/components/golf/OfflineIndicator";
import { GoogleMapsGolfView } from "@/components/golf/GoogleMapsGolfView";
import { EnhancedGoogleMapsView } from "@/components/golf/EnhancedGoogleMapsView";
import { ApiKeySettings } from "@/components/golf/ApiKeySettings";
import { comprehensiveNYCourses } from "@/data/comprehensive-ny-courses";
import { Course, ScoreEntry, Round } from "@/types/golf";
import { Shot, ShotTrackingRound } from "@/types/shot";
import { OfflineService } from "@/services/offline";
import { calculateDistance } from "@/utils/gps";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [selectedCourse, setSelectedCourse] = useState<Course>(comprehensiveNYCourses[0]);
  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [currentHole, setCurrentHole] = useState(1);
  const [shotTrackingRound, setShotTrackingRound] = useState<ShotTrackingRound | null>(null);
  const [activeView, setActiveView] = useState<'home' | 'courses' | 'play'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [pastRounds, setPastRounds] = useState<Round[]>([]);
  const [roundPhotos, setRoundPhotos] = useState<any[]>([]);
  const { toast } = useToast();

  // Load past rounds from localStorage and initialize offline service
  useEffect(() => {
    const savedRounds = localStorage.getItem('golfRounds');
    if (savedRounds) {
      setPastRounds(JSON.parse(savedRounds));
    }
    
    // Initialize offline service
    OfflineService.initialize();
    OfflineService.saveCourses(comprehensiveNYCourses); // Cache courses offline
  }, []);

  // Save rounds to localStorage
  const saveRounds = (rounds: Round[]) => {
    localStorage.setItem('golfRounds', JSON.stringify(rounds));
    setPastRounds(rounds);
  };

  // Filter courses based on search and location
  const filteredCourses = comprehensiveNYCourses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesLocation = locationFilter === 'all';
    
    if (!matchesLocation) {
      const location = course.location.toLowerCase();
      switch (locationFilter) {
        case 'nyc':
          matchesLocation = location.includes('bronx') || location.includes('brooklyn') || 
                           location.includes('queens') || location.includes('manhattan') || 
                           location.includes('staten island');
          break;
        case 'longisland':
          matchesLocation = location.includes('farmingdale') || location.includes('babylon') ||
                           location.includes('coram') || location.includes('montauk') ||
                           location.includes('east meadow') || location.includes('glen cove') ||
                           location.includes('port washington') || location.includes('lido') ||
                           location.includes('smithtown') || location.includes('southampton') ||
                           location.includes('riverhead') || location.includes('greenport') ||
                           location.includes('middle island') || location.includes('manorville') ||
                           location.includes('great river') || location.includes('west sayville') ||
                           location.includes('kings park') || location.includes('northport') ||
                           location.includes('holbrook') || location.includes('brentwood') ||
                           location.includes('west babylon') || location.includes('bay shore');
          break;
        case 'westchester':
          matchesLocation = location.includes('yonkers') || location.includes('ossining') ||
                           location.includes('white plains') || location.includes('yorktown') ||
                           location.includes('scarsdale') || location.includes('pleasant valley') ||
                           location.includes('congers') || location.includes('mamaroneck') ||
                           location.includes('rye') || location.includes('scarborough');
          break;
        case 'upstate':
          matchesLocation = location.includes('saratoga') || location.includes('amsterdam') ||
                           location.includes('colonie') || location.includes('schenectady') ||
                           location.includes('troy') || location.includes('ballston spa');
          break;
        case 'central':
          matchesLocation = location.includes('fayetteville') || location.includes('sterling') ||
                           location.includes('horseheads') || location.includes('chenango') ||
                           location.includes('akron') || location.includes('syracuse') ||
                           location.includes('skaneateles') || location.includes('verona');
          break;
        case 'western':
          matchesLocation = location.includes('painted post') || location.includes('buffalo') ||
                           location.includes('niagara') || location.includes('lockport') ||
                           location.includes('east aurora') || location.includes('batavia') ||
                           location.includes('rochester');
          break;
      }
    }
    
    return matchesSearch && matchesLocation;
  });

  // Get unique locations for filter
  const locations = ['all', ...Array.from(new Set(comprehensiveNYCourses.map(course => {
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

  const updateShot = (shotId: string, coordinates: { lat: number; lng: number }) => {
    if (!shotTrackingRound) return;
    
    const currentHoleData = getCurrentHoleData();
    if (!currentHoleData) return;
    
    const updatedShots = shotTrackingRound.shots.map(shot => {
      if (shot.id === shotId) {
        // Recalculate distance based on shot type
        const currentHoleShots = shotTrackingRound.shots.filter(s => s.holeNumber === shot.holeNumber);
        let distance: number;
        
        if (shot.shotNumber === 1) {
          // First shot: distance from tee
          distance = calculateDistance(currentHoleData.teeCoords, coordinates);
        } else {
          // Subsequent shots: distance from previous shot
          const previousShot = currentHoleShots.find(s => s.shotNumber === shot.shotNumber - 1);
          if (previousShot) {
            distance = calculateDistance(previousShot.coordinates, coordinates);
          } else {
            distance = shot.distance; // Keep existing distance if can't calculate
          }
        }
        
        // Keep distances realistic for golf (max 400 yards)
        distance = Math.min(distance, 400);
        
        return { 
          ...shot, 
          coordinates,
          distance
        };
      }
      return shot;
    });
    
    setShotTrackingRound({
      ...shotTrackingRound,
      shots: updatedShots
    });
  };

  const editShot = (shotId: string, updates: Partial<Shot>) => {
    if (!shotTrackingRound) return;
    
    const updatedShots = shotTrackingRound.shots.map(shot =>
      shot.id === shotId ? { ...shot, ...updates } : shot
    );
    
    setShotTrackingRound({
      ...shotTrackingRound,
      shots: updatedShots
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
    const course = comprehensiveNYCourses.find(c => c.name === round.courseId) || comprehensiveNYCourses[0];
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
              Select from {comprehensiveNYCourses.length} premier New York public golf courses and start your professional golf experience
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
                      <SelectTrigger className="w-48 bg-background border-2 hover:border-primary/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-2 shadow-lg z-50">
                        <SelectItem value="all">All Regions</SelectItem>
                        <SelectItem value="nyc">NYC</SelectItem>
                        <SelectItem value="longisland">Long Island</SelectItem>
                        <SelectItem value="westchester">Westchester</SelectItem>
                        <SelectItem value="upstate">Upstate</SelectItem>
                        <SelectItem value="western">Western NY</SelectItem>
                        <SelectItem value="central">Central NY</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="text-center">
                    <Badge variant="outline" className="text-sm">
                      {filteredCourses.length} of {comprehensiveNYCourses.length} courses found
                    </Badge>
                  </div>
                </div>

                {/* Course Selection */}
                <div className="max-w-md mx-auto">
                  <Select
                    value={selectedCourse.name}
                    onValueChange={(value) => {
                      const course = comprehensiveNYCourses.find(c => c.name === value);
                      if (course) setSelectedCourse(course);
                    }}
                  >
                    <SelectTrigger className="h-14 text-lg border-2 hover:border-primary/50 transition-colors bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-80 bg-background border-2 shadow-lg z-50">
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
                  <div className="space-y-8">
                    {/* Course Header with Photo */}
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                            <Navigation className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold">{selectedCourse.name}</h3>
                            <p className="text-muted-foreground">{selectedCourse.location}</p>
                            {selectedCourse.architect && (
                              <p className="text-sm text-primary">Designed by {selectedCourse.architect}</p>
                            )}
                            {selectedCourse.yearBuilt && (
                              <p className="text-xs text-muted-foreground">Established {selectedCourse.yearBuilt}</p>
                            )}
                          </div>
                        </div>
                        
                        {selectedCourse.description && (
                          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                            {selectedCourse.description}
                          </p>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4">
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

                      <div>
                        {selectedCourse.photos && (
                          <div className="aspect-video rounded-xl overflow-hidden mb-4 shadow-lg">
                            <img 
                              src={selectedCourse.photos.hero} 
                              alt={selectedCourse.name}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                        
                        <Button 
                          onClick={startNewRound} 
                          size="lg" 
                          className="w-full h-16 text-lg bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                        >
                          <Play className="w-6 h-6 mr-3" />
                          Start Your Round
                        </Button>
                        <p className="text-center text-sm text-muted-foreground mt-3">
                          Begin professional golf tracking with GPS precision
                        </p>
                      </div>
                    </div>

                    {/* Enhanced Course Information */}
                    <div className="grid md:grid-cols-3 gap-6">
                      {/* Tee Box Information */}
                      {selectedCourse.holes[0]?.teeBoxes && (
                        <div className="bg-white/40 rounded-xl p-6">
                          <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <Target className="w-5 h-5 text-primary" />
                            Tee Options
                          </h4>
                          <div className="space-y-2">
                            {selectedCourse.holes[0].teeBoxes.map((tee, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-white/50 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full border" 
                                    style={{ backgroundColor: tee.color, borderColor: tee.color === '#FFFFFF' ? '#000' : tee.color }}
                                  />
                                  <span className="font-medium text-sm">{tee.name}</span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {Math.round(tee.rating * 10) / 10}/{tee.slope}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Green Fees */}
                      {selectedCourse.greenFees && (
                        <div className="bg-white/40 rounded-xl p-6">
                          <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <div className="w-5 h-5 text-primary">$</div>
                            Green Fees
                          </h4>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center p-2 bg-white/50 rounded-lg">
                              <span className="text-sm">Weekday</span>
                              <span className="font-bold text-primary">${selectedCourse.greenFees.weekday}</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-white/50 rounded-lg">
                              <span className="text-sm">Weekend</span>
                              <span className="font-bold text-primary">${selectedCourse.greenFees.weekend}</span>
                            </div>
                            {selectedCourse.greenFees.twilight && (
                              <div className="flex justify-between items-center p-2 bg-white/50 rounded-lg">
                                <span className="text-sm">Twilight</span>
                                <span className="font-bold text-accent">${selectedCourse.greenFees.twilight}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Amenities */}
                      {selectedCourse.amenities && selectedCourse.amenities.length > 0 && (
                        <div className="bg-white/40 rounded-xl p-6">
                          <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-primary" />
                            Amenities
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedCourse.amenities.slice(0, 6).map((amenity, index) => (
                              <Badge key={index} variant="secondary" className="bg-white/60 text-xs">
                                {amenity}
                              </Badge>
                            ))}
                            {selectedCourse.amenities.length > 6 && (
                              <Badge variant="outline" className="text-xs">
                                +{selectedCourse.amenities.length - 6} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Contact Information */}
                    {(selectedCourse.phoneNumber || selectedCourse.website) && (
                      <div className="bg-white/30 rounded-xl p-4">
                        <div className="flex flex-wrap gap-4 justify-center text-sm">
                          {selectedCourse.phoneNumber && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <span>📞</span>
                              {selectedCourse.phoneNumber}
                            </div>
                          )}
                          {selectedCourse.website && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <span>🌐</span>
                              <a href={selectedCourse.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                                Visit Website
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
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
          <TabsList className="grid w-full grid-cols-6 bg-background/95 backdrop-blur-sm border-2 sticky top-4 z-40 shadow-lg">
            <TabsTrigger value="scorecard" className="text-xs sm:text-sm font-medium">Scorecard</TabsTrigger>
            <TabsTrigger value="gps" className="text-xs sm:text-sm font-medium">GPS Shot Tracking</TabsTrigger>
            <TabsTrigger value="shots" className="text-xs sm:text-sm font-medium">Blue Maps</TabsTrigger>
            <TabsTrigger value="google-maps" className="text-xs sm:text-sm font-medium">Google Maps</TabsTrigger>
            <TabsTrigger value="extras" className="text-xs sm:text-sm font-medium">Extras</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs sm:text-sm font-medium">Settings</TabsTrigger>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GPS currentHole={getCurrentHoleData()} courseId={selectedCourse.name} />
              <WeatherWidget 
                courseLocation={selectedCourse ? {
                  lat: selectedCourse.holes[0]?.teeCoords?.lat || 0,
                  lng: selectedCourse.holes[0]?.teeCoords?.lng || 0
                } : undefined} 
              />
            </div>
          </TabsContent>

          <TabsContent value="shots">
            <BlueGolfMap
              currentHole={getCurrentHoleData()}
              shots={shotTrackingRound?.shots || []}
              onShotAdd={addShot}
              onShotUpdate={updateShot}
              onShotDelete={deleteShot}
              onShotEdit={editShot}
              courseId={selectedCourse.name}
            />
          </TabsContent>

          <TabsContent value="google-maps">
            <EnhancedGoogleMapsView
              currentHole={getCurrentHoleData()}
              shots={shotTrackingRound?.shots || []}
              onShotAdd={addShot}
              onShotUpdate={updateShot}
              onShotDelete={deleteShot}
              courseId={selectedCourse.name}
            />
          </TabsContent>

          <TabsContent value="extras" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <OfflineIndicator />
              <PhotoAttachment 
                photos={roundPhotos}
                onPhotosChange={setRoundPhotos}
                holeNumber={currentHole}
              />
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <ApiKeySettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
