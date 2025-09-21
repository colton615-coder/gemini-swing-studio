/// <reference types="google.maps" />
import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Wind, TrendingUp, MapPin, Navigation2, Target } from 'lucide-react';
import { Hole, Coordinates } from '@/types/golf';
import { Shot } from '@/types/shot';
import { calculateDistance, getCurrentPosition } from '@/utils/gps';
import { useToast } from '@/hooks/use-toast';

interface GoogleMapsGolfViewProps {
  currentHole?: Hole;
  shots: Shot[];
  onShotAdd: (shot: Omit<Shot, 'id' | 'timestamp'>) => void;
  onShotUpdate: (shotId: string, coordinates: { lat: number; lng: number }) => void;
  onShotDelete: (shotId: string) => void;
  courseId?: string;
}

export function GoogleMapsGolfView({
  currentHole,
  shots,
  onShotAdd,
  onShotUpdate,
  onShotDelete,
  courseId
}: GoogleMapsGolfViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [customTeeLocation, setCustomTeeLocation] = useState<Coordinates | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [distanceToPin, setDistanceToPin] = useState<number | null>(null);
  const [showGoogleMapsDialog, setShowGoogleMapsDialog] = useState(false);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const { toast } = useToast();

  // Simulated wind and slope data (in real app, this would come from weather API)
  const [windData] = useState({
    speed: Math.floor(Math.random() * 15) + 5, // 5-20 mph
    direction: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
  });

  const [elevation] = useState({
    change: Math.floor(Math.random() * 40) - 20, // -20 to +20 feet
    slope: (Math.random() * 4 - 2).toFixed(1), // -2% to +2%
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
        
        // Calculate distance to pin
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

  // Initialize Google Maps
  useEffect(() => {
    if (!mapRef.current || !currentHole) return;

    const initializeMap = async () => {
      try {
        // Note: For demo - replace with actual Google Maps API key
        // You can get one at: https://developers.google.com/maps/documentation/javascript/get-api-key
        const DEMO_API_KEY = "AIzaSyBFw0Qby..."; // Replace with real key
        
        const loader = new Loader({
          apiKey: DEMO_API_KEY,
          version: "weekly",
          libraries: ["places"]
        });

        const google = await loader.load();

        const mapInstance = new google.maps.Map(mapRef.current!, {
          center: {
            lat: currentHole.teeCoords?.lat || currentHole.greenCoords.lat,
            lng: currentHole.teeCoords?.lng || currentHole.greenCoords.lng
          },
          zoom: 18,
          mapTypeId: google.maps.MapTypeId.SATELLITE,
          disableDefaultUI: true,
          zoomControl: true,
          zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_BOTTOM
          },
          gestureHandling: 'greedy'
        });

        setMap(mapInstance);
        setIsMapReady(true);

        // Add click handler for placing shots
        mapInstance.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          
          const currentHoleShots = shots.filter(s => s.holeNumber === currentHole.holeNumber);
          const shotNumber = currentHoleShots.length + 1;
          
          // Calculate distance
          const teeCoords = customTeeLocation || currentHole.teeCoords;
          let distance = 0;
          
          if (currentHoleShots.length === 0 && teeCoords) {
            distance = calculateDistance({ lat, lng }, teeCoords);
          } else if (currentHoleShots.length > 0) {
            const previousShot = currentHoleShots[currentHoleShots.length - 1];
            distance = calculateDistance({ lat, lng }, previousShot.coordinates);
          }

          onShotAdd({
            holeNumber: currentHole.holeNumber,
            shotNumber,
            coordinates: { lat, lng },
            club: shotNumber === 1 ? 'Driver' : '7-Iron',
            distance: Math.round(distance),
            lie: shotNumber === 1 ? 'tee' : 'fairway'
          });

          toast({
            title: `Shot ${shotNumber} Placed`,
            description: `${Math.round(distance)} yards`
          });
        });

      } catch (error) {
        console.error('Error loading Google Maps:', error);
        toast({
          title: "Maps Error",
          description: "Could not load Google Maps. Using fallback view.",
          variant: "destructive"
        });
      }
    };

    initializeMap();
  }, [currentHole]);

  // Update markers when shots or hole changes
  useEffect(() => {
    if (!map || !isMapReady || !currentHole) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    const newMarkers: google.maps.Marker[] = [];

    // Add tee marker
    const teeCoords = customTeeLocation || currentHole.teeCoords;
    if (teeCoords) {
      const teeMarker = new google.maps.Marker({
        position: { lat: teeCoords.lat, lng: teeCoords.lng },
        map: map,
        title: 'Tee Box',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: customTeeLocation ? '#f59e0b' : '#22c55e',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3
        }
      });
      newMarkers.push(teeMarker);
    }

    // Add green marker
    const greenMarker = new google.maps.Marker({
      position: { lat: currentHole.greenCoords.lat, lng: currentHole.greenCoords.lng },
      map: map,
      title: 'Green',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#ef4444',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3
      }
    });
    newMarkers.push(greenMarker);

    // Add user location marker
    if (userLocation) {
      const userMarker = new google.maps.Marker({
        position: { lat: userLocation.lat, lng: userLocation.lng },
        map: map,
        title: 'Your Location',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#3b82f6',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      });
      newMarkers.push(userMarker);
    }

    // Add shot markers
    const currentHoleShots = shots.filter(s => s.holeNumber === currentHole.holeNumber);
    currentHoleShots.forEach((shot, index) => {
      const shotMarker = new google.maps.Marker({
        position: { lat: shot.coordinates.lat, lng: shot.coordinates.lng },
        map: map,
        title: `Shot ${shot.shotNumber}`,
        label: {
          text: shot.shotNumber.toString(),
          color: '#ffffff',
          fontWeight: 'bold'
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#000000',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      });
      newMarkers.push(shotMarker);
    });

    setMarkers(newMarkers);
  }, [map, isMapReady, currentHole, shots, userLocation, customTeeLocation]);

  const openInGoogleMaps = () => {
    if (!currentHole) return;
    
    const teeCoords = customTeeLocation || currentHole.teeCoords;
    const lat = teeCoords?.lat || currentHole.greenCoords.lat;
    const lng = teeCoords?.lng || currentHole.greenCoords.lng;
    
    const url = `https://www.google.com/maps?q=${lat},${lng}&z=18&t=k`;
    window.open(url, '_blank');
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
      {/* Professional Golf Map Interface */}
      <div className="relative h-[650px] w-full overflow-hidden rounded-lg bg-black">
        {/* Google Maps Container */}
        <div ref={mapRef} className="h-full w-full" />
        
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

        {/* Green Maps Indicator - 18Birdies Style */}
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

        {/* Wind & Slope Info */}
        <div className="absolute bottom-32 right-4 z-10">
          <Button
            variant="outline"
            className="bg-black/80 backdrop-blur-sm text-white border-white/30 rounded-full"
            onClick={() => setShowGoogleMapsDialog(true)}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            See wind & slope
          </Button>
        </div>

        {/* Google Maps Integration Button */}
        <div className="absolute bottom-4 left-4 z-10">
          <Button
            onClick={() => setShowGoogleMapsDialog(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-3"
          >
            <MapPin className="w-4 h-4 mr-2" />
            Open in Google Maps
          </Button>
        </div>

        {/* Bottom Navigation - Hole Info */}
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
      </div>

      {/* Google Maps Dialog */}
      <Dialog open={showGoogleMapsDialog} onOpenChange={setShowGoogleMapsDialog}>
        <DialogContent className="bg-black/90 text-white border-0 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center text-lg">
              "Golf App" wants to open<br />"Google Maps"
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {/* Wind & Slope Info */}
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