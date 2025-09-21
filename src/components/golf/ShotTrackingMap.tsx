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
    
    // Add trajectory lines between shots
    if (currentHoleShots.length > 1) {
      const trajectoryCoords = currentHoleShots.map(shot => [shot.coordinates.lat, shot.coordinates.lng] as [number, number]);
      
      // Add line from tee to first shot
      const teeToFirst = [
        [currentHole.teeCoords.lat, currentHole.teeCoords.lng] as [number, number],
        trajectoryCoords[0]
      ];
      L.polyline(teeToFirst, { 
        color: '#f59e0b', 
        weight: 3, 
        opacity: 0.8,
        dashArray: [5, 5]
      }).addTo(shotLayer.current!);
      
      // Add lines between shots
      for (let i = 0; i < trajectoryCoords.length - 1; i++) {
        L.polyline([trajectoryCoords[i], trajectoryCoords[i + 1]], { 
          color: '#f59e0b', 
          weight: 3, 
          opacity: 0.8 
        }).addTo(shotLayer.current!);
      }
      
      // Add distance labels between shots
      for (let i = 0; i < currentHoleShots.length; i++) {
        const shot = currentHoleShots[i];
        if (shot.distance > 0) {
          const midLat = shot.coordinates.lat + 0.0002;
          const midLng = shot.coordinates.lng + 0.0002;
          
          L.divIcon({
            className: 'distance-label',
            html: `<div style="
              background: rgba(0,0,0,0.7);
              color: white;
              padding: 2px 6px;
              border-radius: 10px;
              font-size: 11px;
              font-weight: bold;
              white-space: nowrap;
            ">${shot.distance}yd</div>`,
            iconSize: [30, 20],
            iconAnchor: [15, 10]
          });
          
          L.marker([midLat, midLng], {
            icon: L.divIcon({
              className: 'distance-label',
              html: `<div style="
                background: rgba(0,0,0,0.7);
                color: white;
                padding: 2px 6px;
                border-radius: 10px;
                font-size: 11px;
                font-weight: bold;
                white-space: nowrap;
              ">${shot.distance}yd</div>`,
              iconSize: [30, 20],
              iconAnchor: [15, 10]
            })
          }).addTo(shotLayer.current!);
        }
      }
    } else if (currentHoleShots.length === 1) {
      // Single shot - line from tee to shot
      const trajectoryCoords = [
        [currentHole.teeCoords.lat, currentHole.teeCoords.lng] as [number, number],
        [currentHoleShots[0].coordinates.lat, currentHoleShots[0].coordinates.lng] as [number, number]
      ];
      
      L.polyline(trajectoryCoords, { 
        color: '#f59e0b', 
        weight: 3, 
        opacity: 0.8 
      }).addTo(shotLayer.current!);
      
      // Add distance label
      const shot = currentHoleShots[0];
      if (shot.distance > 0) {
        const midLat = (currentHole.teeCoords.lat + shot.coordinates.lat) / 2;
        const midLng = (currentHole.teeCoords.lng + shot.coordinates.lng) / 2;
        
        L.marker([midLat, midLng], {
          icon: L.divIcon({
            className: 'distance-label',
            html: `<div style="
              background: rgba(0,0,0,0.7);
              color: white;
              padding: 2px 6px;
              border-radius: 10px;
              font-size: 11px;
              font-weight: bold;
              white-space: nowrap;
            ">${shot.distance}yd</div>`,
            iconSize: [30, 20],
            iconAnchor: [15, 10]
          })
        }).addTo(shotLayer.current!);
      }
    }

    // Add shot markers with numbers
    currentHoleShots.forEach((shot, index) => {
      const shotIcon = L.divIcon({
        className: 'shot-marker',
        html: `<div style="
          width: 28px;
          height: 28px;
          background: #3b82f6;
          border: 3px solid white;
          border-radius: 50%;
          color: white;
          font-weight: bold;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        ">${shot.shotNumber}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
      
      const marker = L.marker([shot.coordinates.lat, shot.coordinates.lng], { 
        icon: shotIcon,
        draggable: true
      }).addTo(shotLayer.current!)
        .bindPopup(`
          <div class="p-2">
            <strong>Shot ${shot.shotNumber}</strong><br>
            Club: ${shot.club}<br>
            Lie: ${shot.lie}<br>
            Shot Distance: ${shot.distance} yds
          </div>
        `);
      
      // Add drag event to update shot position
      marker.on('dragend', (e) => {
        const newPos = (e.target as L.Marker).getLatLng();
        // Update shot coordinates (you'd need to implement this in the parent component)
        console.log('Shot moved to:', newPos);
      });
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

      // Add flat 2D tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
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
          
          const currentHoleShots = shots.filter(s => s.holeNumber === currentHole.holeNumber);
          const shotNumber = currentHoleShots.length + 1;
          
          // Calculate distance based on shot type
          let distance: number;
          if (shotNumber === 1) {
            // First shot: distance from tee to clicked position
            distance = calculateDistance(
              currentHole.teeCoords,
              { lat: e.latlng.lat, lng: e.latlng.lng }
            );
          } else {
            // Subsequent shots: distance from previous shot
            const previousShot = currentHoleShots[currentHoleShots.length - 1];
            distance = calculateDistance(
              previousShot.coordinates,
              { lat: e.latlng.lat, lng: e.latlng.lng }
            );
          }
          
          // Keep distances realistic for golf (max 400 yards)
          distance = Math.min(distance, 400);

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
      const currentHoleShots = shots.filter(s => s.holeNumber === currentHole.holeNumber);
      const shotNumber = currentHoleShots.length + 1;
      
      // Calculate distance based on shot type
      let distance: number;
      if (shotNumber === 1) {
        // First shot: distance from tee
        distance = calculateDistance(currentHole.teeCoords, position);
      } else {
        // Subsequent shots: distance from previous shot
        const previousShot = currentHoleShots[currentHoleShots.length - 1];
        distance = calculateDistance(previousShot.coordinates, position);
      }
      
      // Keep distances realistic for golf (max 400 yards)
      distance = Math.min(distance, 400);

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

          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>📍 <strong>Click on map to place shots</strong></p>
            <p>🎯 Drag markers to adjust • Distances show shot length</p>
          </div>
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
                      {shot.lie} • {shot.distance} yds
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