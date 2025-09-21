import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Wind, TrendingUp, MapPin, Navigation2, Target, Crosshair } from 'lucide-react';
import { Hole, Coordinates } from '@/types/golf';
import { Shot } from '@/types/shot';
import { calculateDistance, getCurrentPosition } from '@/utils/gps';
import { useToast } from '@/hooks/use-toast';

interface EnhancedGoogleMapsViewProps {
  currentHole?: Hole;
  shots: Shot[];
  onShotAdd: (shot: Omit<Shot, 'id' | 'timestamp'>) => void;
  onShotUpdate: (shotId: string, coordinates: { lat: number; lng: number }) => void;
  onShotDelete: (shotId: string) => void;
  courseId?: string;
}

export function EnhancedGoogleMapsView({
  currentHole,
  shots,
  onShotAdd,
  onShotUpdate,
  onShotDelete,
  courseId
}: EnhancedGoogleMapsViewProps) {
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [customTeeLocation, setCustomTeeLocation] = useState<Coordinates | null>(null);
  const [distanceToPin, setDistanceToPin] = useState<number | null>(null);
  const [showGoogleMapsDialog, setShowGoogleMapsDialog] = useState(false);
  const { toast } = useToast();

  // Simulated professional data (like 18Birdies)
  const [windData] = useState({
    speed: Math.floor(Math.random() * 15) + 5,
    direction: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
  });

  const [elevation] = useState({
    change: Math.floor(Math.random() * 40) - 20,
    slope: (Math.random() * 4 - 2).toFixed(1),
  });

  // Load custom tee location
  useEffect(() => {
    if (courseId && currentHole) {
      const saved = localStorage.getItem(`customTee_${courseId}_${currentHole.holeNumber}`);
      if (saved) {
        setCustomTeeLocation(JSON.parse(saved));
      } else {
        setCustomTeeLocation(null);
      }
    }
  }, [courseId, currentHole]);

  // Track user location
  useEffect(() => {
    const updateUserLocation = async () => {
      try {
        const position = await getCurrentPosition({ maximumAge: 30000 });
        setUserLocation(position);
        
        if (currentHole && position) {
          const distance = calculateDistance(position, currentHole.greenCoords);
          setDistanceToPin(distance);
        }
      } catch (error) {
        console.log('Could not get user location');
      }
    };

    updateUserLocation();
    const interval = setInterval(updateUserLocation, 30000);
    return () => clearInterval(interval);
  }, [currentHole]);

  const setTeeToMyLocation = async () => {
    if (!courseId || !currentHole || !userLocation) return;
    
    const customTee = { ...userLocation };
    setCustomTeeLocation(customTee);
    localStorage.setItem(`customTee_${courseId}_${currentHole.holeNumber}`, JSON.stringify(customTee));
    
    toast({
      title: "Tee Position Set",
      description: `Hole ${currentHole.holeNumber} tee set to your current location`
    });
  };

  const openInGoogleMaps = () => {
    if (!currentHole) return;
    
    const teeCoords = customTeeLocation || currentHole.teeCoords;
    const lat = teeCoords?.lat || currentHole.greenCoords.lat;
    const lng = teeCoords?.lng || currentHole.greenCoords.lng;
    
    const url = `https://www.google.com/maps?q=${lat},${lng}&z=18&t=k`;
    window.open(url, '_blank');
  };

  const addShotAtLocation = () => {
    if (!currentHole || !userLocation) return;
    
    const currentHoleShots = shots.filter(s => s.holeNumber === currentHole.holeNumber);
    const shotNumber = currentHoleShots.length + 1;
    
    const teeCoords = customTeeLocation || currentHole.teeCoords;
    let distance = 0;
    
    if (currentHoleShots.length === 0 && teeCoords) {
      distance = calculateDistance(userLocation, teeCoords);
    } else if (currentHoleShots.length > 0) {
      const previousShot = currentHoleShots[currentHoleShots.length - 1];
      distance = calculateDistance(userLocation, previousShot.coordinates);
    }

    onShotAdd({
      holeNumber: currentHole.holeNumber,
      shotNumber,
      coordinates: userLocation,
      club: shotNumber === 1 ? 'Driver' : '7-Iron',
      distance: Math.round(distance),
      lie: shotNumber === 1 ? 'tee' : 'fairway'
    });

    toast({
      title: `Shot ${shotNumber} Added`,
      description: `Added at your current location - ${Math.round(distance)} yards`
    });
  };

  if (!currentHole) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Select a hole to view course details</p>
      </Card>
    );
  }

  const currentHoleShots = shots.filter(s => s.holeNumber === currentHole.holeNumber);

  return (
    <div className="relative">
      {/* Professional Golf Interface - 18Birdies Style */}
      <div className="relative h-[650px] w-full overflow-hidden rounded-lg bg-gradient-to-br from-green-900 via-green-800 to-green-700">
        {/* Simulated Satellite Background */}
        <div className="absolute inset-0 opacity-80">
          <div className="w-full h-full bg-gradient-to-br from-green-600 via-yellow-600 to-brown-600 relative">
            {/* Simulated course features */}
            <div className="absolute top-1/4 left-1/3 w-32 h-20 bg-green-400 rounded-full opacity-70"></div>
            <div className="absolute bottom-1/3 right-1/4 w-24 h-16 bg-green-500 rounded-full opacity-80"></div>
            <div className="absolute top-1/2 left-1/2 w-16 h-12 bg-sand rounded-lg opacity-60"></div>
            <div className="absolute bottom-1/4 left-1/4 w-8 h-8 bg-blue-400 rounded-full opacity-70"></div>
          </div>
        </div>
        
        {/* Header Overlay - 18Birdies Style */}
        <div className="absolute top-0 left-0 right-0 z-10">
          <div className="bg-black/80 backdrop-blur-sm text-white p-4 rounded-b-lg mx-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-4xl font-bold">{currentHole.holeNumber}</div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-3 text-sm">
                    <span className="text-gray-300">Mid Green</span>
                    <span className="text-gray-300">Par</span>
                    <span className="text-gray-300">White</span>
                    <span className="text-gray-300">Handicap</span>
                  </div>
                  <div className="flex items-center space-x-3 font-semibold">
                    <span className="text-xl">{distanceToPin || '--'}yds</span>
                    <span className="text-xl">{currentHole.par}</span>
                    <span className="text-xl">{currentHole.distance || 300}</span>
                    <span className="text-xl">{currentHole.handicap || 10}</span>
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="text-white border-white">
                {currentHoleShots.length} shots
              </Badge>
            </div>
          </div>
        </div>

        {/* Distance Overlays */}
        {userLocation && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
            <div className="bg-black/80 backdrop-blur-sm text-white p-3 rounded-full">
              <div className="text-center">
                <div className="text-2xl font-bold">{distanceToPin}y</div>
                <div className="text-xs text-gray-300">to pin</div>
              </div>
            </div>
          </div>
        )}

        {/* Green Maps Indicator */}
        <div className="absolute right-4 top-32 z-10">
          <Card className="bg-black/80 backdrop-blur-sm text-white p-3 border-0">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 via-yellow-400 to-red-400 rounded-lg flex items-center justify-center">
              <div className="w-12 h-12 bg-green-500 rounded-lg opacity-80"></div>
            </div>
            <div className="text-xs text-center mt-2 text-blue-400 font-semibold">
              Green<br />Maps
            </div>
          </Card>
        </div>

        {/* Control Buttons */}
        <div className="absolute bottom-32 left-4 right-4 z-10">
          <div className="flex justify-between">
            <div className="space-y-2">
              {userLocation && (
                <>
                  <Button
                    onClick={setTeeToMyLocation}
                    className="bg-orange-600 hover:bg-orange-700 text-white rounded-lg"
                  >
                    <Crosshair className="w-4 h-4 mr-2" />
                    Set Tee Here
                  </Button>
                  <Button
                    onClick={addShotAtLocation}
                    className="bg-green-600 hover:bg-green-700 text-white rounded-lg"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Add Shot Here
                  </Button>
                </>
              )}
            </div>
            
            <Button
              onClick={() => setShowGoogleMapsDialog(true)}
              className="bg-white/20 backdrop-blur-sm text-white border-white/30 rounded-full"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              See wind & slope
            </Button>
          </div>
        </div>

        {/* Google Maps Integration */}
        <div className="absolute bottom-4 left-4 z-10">
          <Button
            onClick={() => setShowGoogleMapsDialog(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-3"
          >
            <MapPin className="w-4 h-4 mr-2" />
            Open in Google Maps
          </Button>
        </div>

        {/* Bottom Navigation */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <div className="bg-black/90 backdrop-blur-sm text-white p-4 rounded-t-lg mx-4 mb-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" className="text-white">
                ←
              </Button>
              <div className="text-center">
                <div className="text-2xl font-bold">Hole {currentHole.holeNumber}</div>
                <div className="text-sm text-gray-300">Par {currentHole.par}</div>
              </div>
              <Button variant="ghost" size="sm" className="text-white">
                →
              </Button>
            </div>
          </div>
        </div>

        {/* Shot Markers Overlay */}
        {currentHoleShots.map((shot, index) => (
          <div
            key={shot.id}
            className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${30 + index * 15}%`,
              top: `${40 + index * 10}%`
            }}
          >
            <div className="bg-black text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold border-2 border-white">
              {shot.shotNumber}
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Dialog with Wind & Slope */}
      <Dialog open={showGoogleMapsDialog} onOpenChange={setShowGoogleMapsDialog}>
        <DialogContent className="bg-black/90 text-white border-0 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center text-lg">
              "Golf App" wants to open<br />"Google Maps"
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {/* Professional Wind & Slope Info */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Wind className="w-5 h-5 text-blue-400" />
                  <span>Wind</span>
                </div>
                <span className="font-semibold">{windData.speed} mph {windData.direction}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <span>Elevation</span>
                </div>
                <span className="font-semibold">{elevation.change > 0 ? '+' : ''}{elevation.change}ft ({elevation.slope}%)</span>
              </div>
              {distanceToPin && (
                <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Target className="w-5 h-5 text-red-400" />
                    <span>Distance</span>
                  </div>
                  <span className="font-semibold">{distanceToPin} yards</span>
                </div>
              )}
            </div>
            
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowGoogleMapsDialog(false)}
                className="flex-1 bg-gray-600 text-white border-gray-500 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  openInGoogleMaps();
                  setShowGoogleMapsDialog(false);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Open
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}