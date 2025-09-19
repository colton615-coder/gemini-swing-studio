import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Target, Plus, Trash2 } from "lucide-react";
import { Hole } from "@/types/golf";
import { Shot } from "@/types/shot";
import { calculateDistance, getCurrentPosition } from "@/utils/gps";
import { useToast } from "@/hooks/use-toast";

// Fix default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface ShotTrackingMapProps {
  currentHole?: Hole;
  shots: Shot[];
  onShotAdd: (shot: Omit<Shot, 'id' | 'timestamp'>) => void;
  onShotDelete: (shotId: string) => void;
}

export function ShotTrackingMap({ currentHole, shots, onShotAdd, onShotDelete }: ShotTrackingMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const shotLayer = useRef<L.LayerGroup | null>(null);
  const [newShotClub, setNewShotClub] = useState<string>('Driver');
  const [newShotLie, setNewShotLie] = useState<'fairway' | 'rough' | 'sand' | 'green' | 'tee'>('tee');
  const { toast } = useToast();

  const clubs = [
    'Driver', '3-Wood', '5-Wood', 'Hybrid', 
    '3-Iron', '4-Iron', '5-Iron', '6-Iron', '7-Iron', '8-Iron', '9-Iron',
    'Pitching Wedge', 'Sand Wedge', 'Lob Wedge', 'Putter'
  ];

  const createCustomIcon = (color: string) => {
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        width: 20px;
        height: 20px;
        background: ${color};
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
  };

  const updateShotMarkers = () => {
    if (!map.current || !currentHole) return;

    if (!shotLayer.current) {
      shotLayer.current = L.layerGroup().addTo(map.current);
    }
    shotLayer.current.clearLayers();

    const currentHoleShots = shots.filter(s => s.holeNumber === currentHole.holeNumber);
    currentHoleShots.forEach((shot) => {
      const shotIcon = createCustomIcon('#3b82f6');
      L.marker([shot.coordinates.lat, shot.coordinates.lng], { icon: shotIcon })
        .addTo(shotLayer.current!)
        .bindPopup(`
          <div class="p-2">
            <strong>Shot ${shot.shotNumber}</strong><br>
            Club: ${shot.club}<br>
            Lie: ${shot.lie}<br>
            Distance: ${shot.distance} yds
          </div>
        `);
    });
  };

  const initializeMap = () => {
    if (!mapContainer.current || !currentHole) return;

    try {
      // Clean up any existing instance safely
      if (map.current) {
        map.current.off();
        map.current.remove();
        map.current = null;
      }
      // Ensure container is empty
      mapContainer.current.innerHTML = '';

      // Create map centered on tee
      map.current = L.map(mapContainer.current).setView(
        [currentHole.teeCoords.lat, currentHole.teeCoords.lng], 
        16
      );

      // Add satellite tile layer
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; Esri &copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map.current);

      // Add tee marker
      const teeIcon = createCustomIcon('#22c55e');
      L.marker([currentHole.teeCoords.lat, currentHole.teeCoords.lng], { icon: teeIcon })
        .addTo(map.current!)
        .bindPopup(`
          <div class="p-2">
            <strong>Hole ${currentHole.holeNumber} Tee</strong><br>
            Par ${currentHole.par} • ${currentHole.distance} yards
          </div>
        `);

      // Add green marker
      const greenIcon = createCustomIcon('#ef4444');
      L.marker([currentHole.greenCoords.lat, currentHole.greenCoords.lng], { icon: greenIcon })
        .addTo(map.current!)
        .bindPopup(`
          <div class="p-2">
            <strong>Hole ${currentHole.holeNumber} Green</strong>
          </div>
        `);

      // Shot markers layer and initial render
      shotLayer.current = L.layerGroup().addTo(map.current);
      updateShotMarkers();

      // Add click handler for adding shots
      map.current.on('click', (e: L.LeafletMouseEvent) => {
        try {
          if (!currentHole) return;
          
          const shotNumber = shots.filter(s => s.holeNumber === currentHole.holeNumber).length + 1;
          const distance = calculateDistance(
            { lat: e.latlng.lat, lng: e.latlng.lng },
            currentHole.greenCoords
          );

          onShotAdd({
            holeNumber: currentHole.holeNumber,
            shotNumber,
            coordinates: { lat: e.latlng.lat, lng: e.latlng.lng },
            club: newShotClub,
            distance,
            lie: newShotLie
          });

          console.log('Shot added from map click', { hole: currentHole.holeNumber, shotNumber });
          toast({
            title: "Shot Added",
            description: `Shot ${shotNumber} with ${newShotClub} from ${newShotLie}`
          });
        } catch (err) {
          console.error('Error handling map click', err);
          toast({
            title: "Error",
            description: "There was a problem adding your shot.",
            variant: "destructive"
          });
        }
      });

      // Fit bounds to show tee and green
      const bounds = L.latLngBounds([
        [currentHole.teeCoords.lat, currentHole.teeCoords.lng],
        [currentHole.greenCoords.lat, currentHole.greenCoords.lng]
      ]);
      map.current.fitBounds(bounds, { padding: [50, 50] });
    } catch (err) {
      console.error('Error initializing map', err);
      toast({
        title: "Map Error",
        description: "There was a problem initializing the map.",
        variant: "destructive"
      });
    }
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

  useEffect(() => {
    if (!currentHole) return;

    // Reinitialize map when hole changes
    if (map.current) {
      try {
        map.current.off();
        map.current.remove();
      } catch (err) {
        console.error('Error removing map', err);
      }
      map.current = null;
    }
    initializeMap();

    return () => {
      if (map.current) {
        try {
          map.current.off();
          map.current.remove();
        } catch (err) {
          console.error('Error cleaning up map', err);
        }
        map.current = null;
      }
    };
  }, [currentHole]);

  useEffect(() => {
    // Update shot markers without recreating the map
    updateShotMarkers();
  }, [shots, currentHole]);

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
        <div className="p-2 text-center text-xs text-muted-foreground bg-muted/30">
          📡 Free OpenStreetMap • No API keys required
        </div>
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