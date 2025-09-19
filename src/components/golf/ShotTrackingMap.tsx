import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Target, Plus, Trash2 } from "lucide-react";
import { Hole } from "@/types/golf";
import { Shot } from "@/types/shot";
import { calculateDistance, getCurrentPosition } from "@/utils/gps";
import { useToast } from "@/hooks/use-toast";

interface ShotTrackingMapProps {
  currentHole?: Hole;
  shots: Shot[];
  onShotAdd: (shot: Omit<Shot, 'id' | 'timestamp'>) => void;
  onShotDelete: (shotId: string) => void;
}

export function ShotTrackingMap({ currentHole, shots, onShotAdd, onShotDelete }: ShotTrackingMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [isTokenSaved, setIsTokenSaved] = useState(false);
  const [newShotClub, setNewShotClub] = useState<string>('Driver');
  const [newShotLie, setNewShotLie] = useState<'fairway' | 'rough' | 'sand' | 'green' | 'tee'>('tee');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { toast } = useToast();

  const clubs = [
    'Driver', '3-Wood', '5-Wood', 'Hybrid', 
    '3-Iron', '4-Iron', '5-Iron', '6-Iron', '7-Iron', '8-Iron', '9-Iron',
    'Pitching Wedge', 'Sand Wedge', 'Lob Wedge', 'Putter'
  ];

  const initializeMap = () => {
    if (!mapContainer.current || !mapboxToken || !currentHole) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-v9',
      center: [currentHole.teeCoords.lng, currentHole.teeCoords.lat],
      zoom: 16,
      pitch: 45,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    map.current.on('load', () => {
      if (!map.current || !currentHole) return;

      // Add tee marker
      new mapboxgl.Marker({ color: '#22c55e', scale: 1.2 })
        .setLngLat([currentHole.teeCoords.lng, currentHole.teeCoords.lat])
        .setPopup(new mapboxgl.Popup().setHTML(`<div class="p-2"><strong>Hole ${currentHole.holeNumber} Tee</strong><br>Par ${currentHole.par}</div>`))
        .addTo(map.current);

      // Add green marker
      new mapboxgl.Marker({ color: '#ef4444', scale: 1.2 })
        .setLngLat([currentHole.greenCoords.lng, currentHole.greenCoords.lat])
        .setPopup(new mapboxgl.Popup().setHTML(`<div class="p-2"><strong>Hole ${currentHole.holeNumber} Green</strong></div>`))
        .addTo(map.current);

      // Add existing shots
      shots.forEach((shot, index) => {
        const marker = new mapboxgl.Marker({ 
          color: '#3b82f6', 
          scale: 0.8 
        })
        .setLngLat([shot.coordinates.lng, shot.coordinates.lat])
        .setPopup(new mapboxgl.Popup().setHTML(`
          <div class="p-2">
            <strong>Shot ${shot.shotNumber}</strong><br>
            Club: ${shot.club}<br>
            Lie: ${shot.lie}<br>
            Distance: ${shot.distance} yds
          </div>
        `))
        .addTo(map.current!);
      });

      // Add click handler for adding shots
      map.current.on('click', (e) => {
        if (!currentHole) return;
        
        const shotNumber = shots.filter(s => s.holeNumber === currentHole.holeNumber).length + 1;
        const distance = calculateDistance(
          { lat: e.lngLat.lat, lng: e.lngLat.lng },
          currentHole.greenCoords
        );

        onShotAdd({
          holeNumber: currentHole.holeNumber,
          shotNumber,
          coordinates: { lat: e.lngLat.lat, lng: e.lngLat.lng },
          club: newShotClub,
          distance,
          lie: newShotLie
        });

        toast({
          title: "Shot Added",
          description: `Shot ${shotNumber} with ${newShotClub} from ${newShotLie}`
        });
      });
    });
  };

  const addCurrentLocationShot = async () => {
    if (!currentHole) return;
    
    try {
      const position = await getCurrentPosition();
      const shotNumber = shots.filter(s => s.holeNumber === currentHole.holeNumber).length + 1;
      const distance = calculateDistance(position, currentHole.greenCoords);

      onShotAdd({
        holeNumber: currentHole.holeNumber,
        shotNumber,
        coordinates: position,
        club: newShotClub,
        distance,
        lie: newShotLie
      });

      toast({
        title: "Shot Added",
        description: `Shot ${shotNumber} added at your current location`
      });
    } catch (error) {
      toast({
        title: "Location Error",
        description: "Could not get your current location",
        variant: "destructive"
      });
    }
  };

  const saveToken = () => {
    if (mapboxToken.startsWith('pk.')) {
      setIsTokenSaved(true);
      localStorage.setItem('mapbox_token', mapboxToken);
      toast({
        title: "Token Saved",
        description: "Mapbox token saved successfully"
      });
    } else {
      toast({
        title: "Invalid Token",
        description: "Please enter a valid Mapbox public token (starts with pk.)",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('mapbox_token');
    if (savedToken) {
      setMapboxToken(savedToken);
      setIsTokenSaved(true);
    }
  }, []);

  useEffect(() => {
    if (isTokenSaved && mapboxToken && currentHole) {
      // Clean up existing map
      if (map.current) {
        map.current.remove();
      }
      initializeMap();
    }

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [isTokenSaved, mapboxToken, currentHole, shots]);

  if (!isTokenSaved) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-4">
          <MapPin className="w-12 h-12 mx-auto text-primary" />
          <h3 className="text-lg font-semibold">Setup Interactive Map</h3>
          <p className="text-muted-foreground">
            Enter your Mapbox public token to enable shot tracking with interactive maps.
          </p>
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEi..."
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Get your free token at <a href="https://mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">mapbox.com</a>
            </p>
            <Button onClick={saveToken} disabled={!mapboxToken}>
              Save Token
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  const currentHoleShots = shots.filter(s => currentHole && s.holeNumber === currentHole.holeNumber);

  return (
    <div className="space-y-4">
      {/* Shot Controls */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Target className="w-5 h-5" />
              Shot Tracking
            </h3>
            <Badge variant="outline">
              {currentHoleShots.length} shots
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1">Club</label>
              <Select value={newShotClub} onValueChange={setNewShotClub}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {clubs.map((club) => (
                    <SelectItem key={club} value={club}>
                      {club}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Lie</label>
              <Select value={newShotLie} onValueChange={(value) => setNewShotLie(value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tee">Tee</SelectItem>
                  <SelectItem value="fairway">Fairway</SelectItem>
                  <SelectItem value="rough">Rough</SelectItem>
                  <SelectItem value="sand">Sand</SelectItem>
                  <SelectItem value="green">Green</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={addCurrentLocationShot} className="flex-1">
              <Plus className="w-4 h-4 mr-2" />
              Add Shot Here
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Tap anywhere on the map to add a shot at that location
          </p>
        </div>
      </Card>

      {/* Map */}
      <Card className="overflow-hidden">
        <div ref={mapContainer} className="h-96 w-full" />
      </Card>

      {/* Shot List */}
      {currentHoleShots.length > 0 && (
        <Card className="p-4">
          <h4 className="font-medium mb-3">Shots for Hole {currentHole?.holeNumber}</h4>
          <div className="space-y-2">
            {currentHoleShots.map((shot) => (
              <div key={shot.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">#{shot.shotNumber}</Badge>
                  <div>
                    <p className="font-medium">{shot.club}</p>
                    <p className="text-sm text-muted-foreground">
                      {shot.lie} • {shot.distance} yds to green
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onShotDelete(shot.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}