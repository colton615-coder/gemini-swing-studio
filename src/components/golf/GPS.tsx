import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Target, Crosshair } from "lucide-react";
import { Coordinates, Hole } from "@/types/golf";
import { calculateDistance, getCurrentPosition } from "@/utils/gps";
import { useToast } from "@/hooks/use-toast";

interface GPSProps {
  currentHole?: Hole;
  courseId?: string;
}

export function GPS({ currentHole, courseId }: GPSProps) {
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [customTeeLocation, setCustomTeeLocation] = useState<Coordinates | null>(null);
  const [distances, setDistances] = useState<{
    toTee: number | null;
    toGreen: number | null;
  }>({
    toTee: null,
    toGreen: null
  });
  
  const { toast } = useToast();

  // Load custom tee location for this course/hole
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

  const updateLocation = async () => {
    setIsLoading(true);
    try {
      const position = await getCurrentPosition({ maximumAge: 0 }); // Force fresh location
      setUserLocation(position);
      
      if (currentHole) {
        const teeCoords = customTeeLocation || currentHole.teeCoords;
        const toTee = teeCoords ? 
          calculateDistance(position, teeCoords) : null;
        const toGreen = calculateDistance(position, currentHole.greenCoords);
        
        setDistances({
          toTee,
          toGreen
        });
      }
      
      toast({
        title: "Location Updated",
        description: `GPS refreshed: ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unable to get your location. Please check GPS permissions.";
      toast({
        title: "GPS Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const setTeeToMyLocation = async () => {
    if (!courseId || !currentHole || !userLocation) return;
    
    const customTee = { ...userLocation };
    setCustomTeeLocation(customTee);
    
    // Save to localStorage
    localStorage.setItem(`customTee_${courseId}_${currentHole.holeNumber}`, JSON.stringify(customTee));
    
    // Recalculate distances
    const toTee = calculateDistance(userLocation, customTee);
    const toGreen = calculateDistance(userLocation, currentHole.greenCoords);
    
    setDistances({ toTee, toGreen });
    
    toast({
      title: "Tee Position Set",
      description: `Hole ${currentHole.holeNumber} tee set to your current location`
    });
  };

  const resetTeeLocation = () => {
    if (!courseId || !currentHole) return;
    
    localStorage.removeItem(`customTee_${courseId}_${currentHole.holeNumber}`);
    setCustomTeeLocation(null);
    
    if (userLocation && currentHole.teeCoords) {
      const toTee = calculateDistance(userLocation, currentHole.teeCoords);
      const toGreen = calculateDistance(userLocation, currentHole.greenCoords);
      setDistances({ toTee, toGreen });
    }
    
    toast({
      title: "Tee Position Reset",
      description: "Using original course tee location"
    });
  };

  useEffect(() => {
    if (currentHole && userLocation) {
      const teeCoords = customTeeLocation || currentHole.teeCoords;
      const toTee = teeCoords ? calculateDistance(userLocation, teeCoords) : null;
      const toGreen = calculateDistance(userLocation, currentHole.greenCoords);
      
      setDistances({
        toTee,
        toGreen
      });
    }
  }, [currentHole, userLocation, customTeeLocation]);

  // Auto-update location when component mounts
  useEffect(() => {
    updateLocation();
  }, []);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">GPS Distances</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={updateLocation}
          disabled={isLoading}
        >
          <Navigation className="w-4 h-4 mr-2" />
          {isLoading ? "Updating..." : "Refresh"}
        </Button>
      </div>

      {!currentHole ? (
        <p className="text-center text-muted-foreground py-8">
          Select a hole to see GPS distances
        </p>
      ) : (
        <div className="space-y-4">
          <div className="text-center">
            <h4 className="font-medium mb-2">Hole {currentHole.holeNumber} - Par {currentHole.par}</h4>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Target className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">
                To Tee {customTeeLocation && <Badge variant="outline" className="ml-1 text-xs">Custom</Badge>}
              </p>
              <p className="text-xl font-bold">
                {distances.toTee ? `${distances.toTee} yds` : '--'}
              </p>
            </div>

            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="w-6 h-6 mx-auto mb-2 bg-primary rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
              <p className="text-sm text-muted-foreground">To Green</p>
              <p className="text-xl font-bold">
                {distances.toGreen ? `${distances.toGreen} yds` : '--'}
              </p>
            </div>
          </div>

          {/* Tee Position Controls */}
          <div className="space-y-2 pt-2 border-t">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={setTeeToMyLocation}
                disabled={!userLocation}
                className="flex-1"
              >
                <Crosshair className="w-4 h-4 mr-2" />
                Set Tee Here
              </Button>
              {customTeeLocation && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetTeeLocation}
                  className="flex-1"
                >
                  Reset Tee
                </Button>
              )}
            </div>
          </div>

          {userLocation && (
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Your Location:</span>
                <Badge variant="outline">
                  {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
                </Badge>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}