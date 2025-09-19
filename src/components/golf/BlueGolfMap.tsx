import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Target, Minus } from "lucide-react";
import { Hole } from "@/types/golf";
import { Shot } from "@/types/shot";
import { calculateDistance } from "@/utils/gps";
import { useToast } from "@/hooks/use-toast";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface BlueGolfMapProps {
  currentHole?: Hole;
  shots: Shot[];
  onShotAdd: (shot: Omit<Shot, 'id' | 'timestamp'>) => void;
  onShotUpdate: (shotId: string, coordinates: { lat: number; lng: number }) => void;
  onShotDelete: (shotId: string) => void;
}

export function BlueGolfMap({ 
  currentHole, 
  shots, 
  onShotAdd, 
  onShotUpdate, 
  onShotDelete 
}: BlueGolfMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markersLayer = useRef<L.LayerGroup | null>(null);
  const trajectoryLayer = useRef<L.LayerGroup | null>(null);
  const [selectedShot, setSelectedShot] = useState<string | null>(null);
  const { toast } = useToast();

  const createTeeIcon = () => {
    return L.divIcon({
      className: 'tee-marker',
      html: `<div style="
        width: 24px;
        height: 24px;
        background: #22c55e;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 3px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 12px;
      ">T</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  };

  const createGreenIcon = () => {
    return L.divIcon({
      className: 'green-marker',
      html: `<div style="
        width: 24px;
        height: 24px;
        background: #ef4444;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 3px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 12px;
      ">G</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  };

  const createShotIcon = (shotNumber: number, isSelected: boolean = false) => {
    return L.divIcon({
      className: 'shot-marker',
      html: `<div style="
        width: 20px;
        height: 20px;
        background: ${isSelected ? '#f59e0b' : '#3b82f6'};
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 10px;
        cursor: move;
      ">${shotNumber}</div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
  };

  const updateTrajectory = () => {
    if (!map.current || !currentHole || !trajectoryLayer.current) return;

    trajectoryLayer.current.clearLayers();

    const currentHoleShots = shots
      .filter(s => s.holeNumber === currentHole.holeNumber)
      .sort((a, b) => a.shotNumber - b.shotNumber);

    if (currentHoleShots.length === 0) return;

    // Create trajectory from tee to first shot, then between shots, then to green
    const trajectoryPoints: [number, number][] = [];
    
    // Start from tee
    trajectoryPoints.push([currentHole.teeCoords.lat, currentHole.teeCoords.lng]);
    
    // Add all shot coordinates
    currentHoleShots.forEach(shot => {
      trajectoryPoints.push([shot.coordinates.lat, shot.coordinates.lng]);
    });
    
    // End at green
    trajectoryPoints.push([currentHole.greenCoords.lat, currentHole.greenCoords.lng]);

    // Draw trajectory line (BlueGolf style)
    L.polyline(trajectoryPoints, {
      color: '#fbbf24',
      weight: 4,
      opacity: 0.8,
      smoothFactor: 1
    }).addTo(trajectoryLayer.current);

    // Add distance labels
    for (let i = 0; i < trajectoryPoints.length - 1; i++) {
      const start = { lat: trajectoryPoints[i][0], lng: trajectoryPoints[i][1] };
      const end = { lat: trajectoryPoints[i + 1][0], lng: trajectoryPoints[i + 1][1] };
      const distance = calculateDistance(start, end);
      
      // Calculate midpoint for label
      const midLat = (start.lat + end.lat) / 2;
      const midLng = (start.lng + end.lng) / 2;
      
      L.marker([midLat, midLng], {
        icon: L.divIcon({
          className: 'distance-label',
          html: `<div style="
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: bold;
            white-space: nowrap;
            border: 2px solid white;
          ">${distance}</div>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0]
        })
      }).addTo(trajectoryLayer.current);
    }
  };

  const updateMarkers = () => {
    if (!map.current || !currentHole || !markersLayer.current) return;

    markersLayer.current.clearLayers();

    // Add tee marker
    const teeMarker = L.marker([currentHole.teeCoords.lat, currentHole.teeCoords.lng], { 
      icon: createTeeIcon() 
    }).addTo(markersLayer.current);

    teeMarker.bindPopup(`
      <div class="p-3 min-w-32">
        <div class="font-semibold text-center">Hole ${currentHole.holeNumber}</div>
        <div class="text-center text-sm text-gray-600">Par ${currentHole.par}</div>
        <div class="text-center text-sm font-medium">${currentHole.distance} yards</div>
      </div>
    `);

    // Add green marker
    const greenMarker = L.marker([currentHole.greenCoords.lat, currentHole.greenCoords.lng], { 
      icon: createGreenIcon() 
    }).addTo(markersLayer.current);

    const greenDistance = shots.length > 0 
      ? calculateDistance(shots[shots.length - 1]?.coordinates || currentHole.teeCoords, currentHole.greenCoords)
      : currentHole.distance;

    greenMarker.bindPopup(`
      <div class="p-3 min-w-32">
        <div class="font-semibold text-center">Green</div>
        <div class="text-center text-sm font-medium">${greenDistance} yards</div>
      </div>
    `);

    // Add shot markers
    const currentHoleShots = shots.filter(s => s.holeNumber === currentHole.holeNumber);
    currentHoleShots.forEach((shot) => {
      const shotMarker = L.marker([shot.coordinates.lat, shot.coordinates.lng], { 
        icon: createShotIcon(shot.shotNumber, selectedShot === shot.id),
        draggable: true
      }).addTo(markersLayer.current!);

      // Handle marker drag to update shot coordinates
      shotMarker.on('dragend', (e) => {
        const newLatLng = e.target.getLatLng();
        onShotUpdate(shot.id, { lat: newLatLng.lat, lng: newLatLng.lng });
        toast({
          title: "Shot Updated",
          description: `Shot ${shot.shotNumber} position updated`
        });
      });

      // Handle marker selection
      shotMarker.on('click', () => {
        setSelectedShot(selectedShot === shot.id ? null : shot.id);
      });

      const distanceToGreen = calculateDistance(shot.coordinates, currentHole.greenCoords);
      shotMarker.bindPopup(`
        <div class="p-3 min-w-32">
          <div class="flex justify-between items-center mb-2">
            <span class="font-semibold">Shot ${shot.shotNumber}</span>
            <button onclick="window.deleteShot?.('${shot.id}')" 
                    class="text-red-500 hover:text-red-700 text-xs">
              Delete
            </button>
          </div>
          <div class="space-y-1 text-sm">
            <div>Club: <strong>${shot.club}</strong></div>
            <div>Lie: <strong>${shot.lie}</strong></div>
            <div>To green: <strong>${distanceToGreen} yds</strong></div>
          </div>
          <div class="text-xs text-gray-500 mt-2">
            Drag marker to adjust position
          </div>
        </div>
      `);
    });

    updateTrajectory();
  };

  const initializeMap = () => {
    if (!mapContainer.current || !currentHole) return;

    // Cleanup existing map
    if (map.current) {
      map.current.off();
      map.current.remove();
      map.current = null;
    }

    mapContainer.current.innerHTML = '';

    // Create map with satellite view (BlueGolf style)
    map.current = L.map(mapContainer.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([currentHole.teeCoords.lat, currentHole.teeCoords.lng], 17);

    // Add satellite tiles
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 20
    }).addTo(map.current);

    // Add zoom control in bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map.current);

    // Initialize layers
    markersLayer.current = L.layerGroup().addTo(map.current);
    trajectoryLayer.current = L.layerGroup().addTo(map.current);

    // Add click handler for placing shots
    map.current.on('click', (e: L.LeafletMouseEvent) => {
      if (!currentHole) return;

      const currentHoleShots = shots.filter(s => s.holeNumber === currentHole.holeNumber);
      const shotNumber = currentHoleShots.length + 1;
      const distanceToGreen = calculateDistance(
        { lat: e.latlng.lat, lng: e.latlng.lng },
        currentHole.greenCoords
      );

      onShotAdd({
        holeNumber: currentHole.holeNumber,
        shotNumber,
        coordinates: { lat: e.latlng.lat, lng: e.latlng.lng },
        club: 'Driver', // Default club
        distance: distanceToGreen,
        lie: shotNumber === 1 ? 'tee' : 'fairway' // Default lie
      });

      toast({
        title: "Shot Added",
        description: `Shot ${shotNumber} placed - ${distanceToGreen} yards to green`
      });
    });

    // Set up delete function for popups
    (window as any).deleteShot = (shotId: string) => {
      onShotDelete(shotId);
      toast({
        title: "Shot Deleted",
        description: "Shot removed from hole"
      });
    };

    updateMarkers();

    // Fit bounds to show hole
    const bounds = L.latLngBounds([
      [currentHole.teeCoords.lat, currentHole.teeCoords.lng],
      [currentHole.greenCoords.lat, currentHole.greenCoords.lng]
    ]);
    map.current.fitBounds(bounds, { padding: [30, 30] });
  };

  useEffect(() => {
    if (currentHole) {
      initializeMap();
    }

    return () => {
      if (map.current) {
        map.current.off();
        map.current.remove();
        map.current = null;
      }
    };
  }, [currentHole]);

  useEffect(() => {
    updateMarkers();
  }, [shots, selectedShot]);

  const currentHoleShots = shots.filter(s => currentHole && s.holeNumber === currentHole.holeNumber);
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">Interactive Shot Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Click on map to place shots • Drag markers to adjust
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {currentHoleShots.length} shots
          </Badge>
        </div>
      </Card>

      {/* BlueGolf Style Map */}
      <Card className="overflow-hidden bg-black">
        <div ref={mapContainer} className="h-[500px] w-full" />
        
        {/* Map Controls */}
        <div className="p-4 bg-background border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full border border-white"></div>
                <span>Tee</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full border border-white"></div>
                <span>Green</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full border border-white"></div>
                <span>Shots</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-yellow-400"></div>
                <span>Trajectory</span>
              </div>
            </div>
            
            {selectedShot && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => {
                  onShotDelete(selectedShot);
                  setSelectedShot(null);
                }}
              >
                <Minus className="w-4 h-4 mr-1" />
                Delete Shot
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Shot Summary */}
      {currentHoleShots.length > 0 && (
        <Card className="p-4">
          <h4 className="font-medium mb-3">Hole {currentHole?.holeNumber} Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total Shots:</span>
              <span className="ml-2 font-medium">{currentHoleShots.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Par:</span>
              <span className="ml-2 font-medium">{currentHole?.par}</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}