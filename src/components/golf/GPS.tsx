import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Target } from "lucide-react";
import { Coordinates, Hole } from "@/types/golf";
import { calculateDistance, getCurrentPosition } from "@/utils/gps";
import { useToast } from "@/hooks/use-toast";

interface GPSProps {
  currentHole?: Hole;
}

export function GPS({ currentHole }: GPSProps) {
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [distances, setDistances] = useState<{
    toTee: number | null;
    toGreen: number | null;
  }>({
    toTee: null,
    toGreen: null
  });
  
  const { toast } = useToast();

  const updateLocation = async () => {
    setIsLoading(true);
    try {
      const position = await getCurrentPosition();
      setUserLocation(position);
      
      if (currentHole) {
        const toTee = calculateDistance(position, currentHole.teeCoords);
        const toGreen = calculateDistance(position, currentHole.greenCoords);
        
        setDistances({
          toTee,
          toGreen
        });
      }
      
      toast({
        title: "Location Updated",
        description: "GPS position refreshed successfully"
      });
    } catch (error) {
      toast({
        title: "GPS Error",
        description: "Unable to get your location. Please check GPS permissions.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentHole && userLocation) {
      const toTee = calculateDistance(userLocation, currentHole.teeCoords);
      const toGreen = calculateDistance(userLocation, currentHole.greenCoords);
      
      setDistances({
        toTee,
        toGreen
      });
    }
  }, [currentHole, userLocation]);

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
              <p className="text-sm text-muted-foreground">To Tee</p>
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