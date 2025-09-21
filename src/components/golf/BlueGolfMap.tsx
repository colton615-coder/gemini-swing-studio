import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Target, Minus, Edit2, Trash2 } from "lucide-react";
import { Hole } from "@/types/golf";
import { Shot } from "@/types/shot";
import { calculateDistance, getCurrentPosition } from "@/utils/gps";
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
  onShotEdit?: (shotId: string, updates: Partial<Shot>) => void;
  courseId?: string;
}

export function BlueGolfMap({ 
  currentHole, 
  shots, 
  onShotAdd, 
  onShotUpdate, 
  onShotDelete,
  onShotEdit,
  courseId 
}: BlueGolfMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markersLayer = useRef<L.LayerGroup | null>(null);
  const trajectoryLayer = useRef<L.LayerGroup | null>(null);
  const userLocationMarker = useRef<L.Marker | null>(null);
  const [selectedShot, setSelectedShot] = useState<string | null>(null);
  const [editingShot, setEditingShot] = useState<Shot | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [customTeeLocation, setCustomTeeLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { toast } = useToast();
  const [mapPulse, setMapPulse] = useState(false);

  const clubs = ['Driver', '3-Wood', '5-Wood', '3-Iron', '4-Iron', '5-Iron', '6-Iron', '7-Iron', '8-Iron', '9-Iron', 'PW', 'SW', 'Putter'];
  const lies = ['tee', 'fairway', 'rough', 'sand', 'green'] as const;

  // Load custom tee location and track user location
  useEffect(() => {
    if (courseId && currentHole) {
      const saved = localStorage.getItem(`customTee_${courseId}_${currentHole.holeNumber}`);
      if (saved) {
        setCustomTeeLocation(JSON.parse(saved));
      } else {
        setCustomTeeLocation(null);
      }
    }

    // Update user location every 30 seconds
    const updateUserLocation = async () => {
      try {
        const position = await getCurrentPosition({ maximumAge: 30000 });
        setUserLocation(position);
      } catch (error) {
        console.log('Could not get user location for map');
      }
    };

    updateUserLocation();
    const interval = setInterval(updateUserLocation, 30000);
    return () => clearInterval(interval);
  }, [courseId, currentHole]);

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
        background: ${isSelected ? '#ef4444' : '#ffffff'};
        border: 3px solid ${isSelected ? '#ffffff' : '#000000'};
        border-radius: 50%;
        box-shadow: 0 3px 8px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        color: ${isSelected ? '#ffffff' : '#000000'};
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
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 50%;
            font-size: 16px;
            font-weight: bold;
            white-space: nowrap;
            min-width: 60px;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
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
    L.marker([currentHole.teeCoords.lat, currentHole.teeCoords.lng], { 
      icon: createTeeIcon() 
    }).addTo(markersLayer.current);

    // Add green marker
    L.marker([currentHole.greenCoords.lat, currentHole.greenCoords.lng], { 
      icon: createGreenIcon() 
    }).addTo(markersLayer.current);

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
      shotMarker.on('click', (e) => {
        e.originalEvent.stopPropagation();
        setSelectedShot(selectedShot === shot.id ? null : shot.id);
      });
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

    // Create map with satellite view
    map.current = L.map(mapContainer.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([currentHole.teeCoords.lat, currentHole.teeCoords.lng], 18);

    // Add satellite imagery (Google Satellite)
    L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      attribution: '© Google'
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
      
      // Calculate distance from previous shot or tee
      let distance;
      const teeCoords = customTeeLocation || currentHole.teeCoords;
      
      if (currentHoleShots.length === 0 && teeCoords) {
        // First shot - distance from tee
        distance = calculateDistance(
          { lat: e.latlng.lat, lng: e.latlng.lng },
          teeCoords
        );
      } else {
        // Subsequent shots - distance from previous shot
        const previousShot = currentHoleShots[currentHoleShots.length - 1];
        distance = calculateDistance(
          { lat: e.latlng.lat, lng: e.latlng.lng },
          previousShot.coordinates
        );
      }

      onShotAdd({
        holeNumber: currentHole.holeNumber,
        shotNumber,
        coordinates: { lat: e.latlng.lat, lng: e.latlng.lng },
        club: shotNumber === 1 ? 'Driver' : '7-Iron', // Default clubs
        distance: Math.round(distance),
        lie: shotNumber === 1 ? 'tee' : 'fairway' // Default lie
      });

      toast({
        title: `Shot ${shotNumber} Placed`,
        description: `${Math.round(distance)} yards`
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
  }, [shots, selectedShot, userLocation, customTeeLocation]);

  const currentHoleShots = shots.filter(s => currentHole && s.holeNumber === currentHole.holeNumber);
  const selectedShotData = selectedShot ? currentHoleShots.find(s => s.id === selectedShot) : null;

  const handleEditShot = (shot: Shot) => {
    setEditingShot(shot);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingShot && onShotEdit) {
      onShotEdit(editingShot.id, {
        club: editingShot.club,
        lie: editingShot.lie
      });
      toast({
        title: "Shot Updated",
        description: `Shot ${editingShot.shotNumber} details updated`
      });
    }
    setEditDialogOpen(false);
    setEditingShot(null);
  };

  const handleDeleteShot = (shotId: string) => {
    onShotDelete(shotId);
    setSelectedShot(null);
    toast({
      title: "Shot Deleted",
      description: "Shot removed from hole"
    });
  };
  
  return (
    <div className="relative">
      {/* Professional Golf Map */}
      <div className="relative h-[600px] w-full overflow-hidden rounded-lg bg-black">
        {/* Map Container */}
        <div ref={mapContainer} className="h-full w-full relative z-0" />
        {mapPulse && (
          <div className="pointer-events-none absolute inset-0 z-[5] ring-4 ring-primary/60 rounded-lg animate-pulse" />
        )}
        
        {/* Header Overlay */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-black/70 backdrop-blur-sm">
          <div className="flex items-center justify-between p-4 text-white">
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold">{currentHole?.holeNumber}</div>
              <div className="text-sm">
                <div className="flex items-center gap-2 text-gray-300 mb-1">
                  <span>Mid Green</span>
                  <span>Par</span>
                  <span>{currentHole?.teeBoxes?.[0]?.name || 'White'}</span>
                  <span>Handicap</span>
                </div>
                <div className="flex items-center gap-2 font-semibold text-lg">
                  <span>{currentHole?.distance || currentHole?.teeBoxes?.[0]?.yardage || 'N/A'}</span>
                  <span className="text-sm text-gray-300">Yds</span>
                  <span>{currentHole?.par}</span>
                  <span>{currentHole?.distance || currentHole?.teeBoxes?.[0]?.yardage || 'N/A'}</span>
                  <span>{currentHole?.handicap || 'N/A'}</span>
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-300">
              {currentHoleShots.length} shots
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-black/80 backdrop-blur-sm p-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-white/20"
              onClick={() => {
                // Navigate to scorecard tab
                const tabsTrigger = document.querySelector('[value="scorecard"]') as HTMLElement;
                if (tabsTrigger) tabsTrigger.click();
              }}
            >
              <span className="text-xs">Scorecard</span>
            </Button>
            
            <div className="flex-1 mx-4">
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full py-3"
                onClick={() => {
                  // Navigate to scorecard and focus on current hole
                  const tabsTrigger = document.querySelector('[value="scorecard"]') as HTMLElement;
                  if (tabsTrigger) tabsTrigger.click();
                }}
              >
                <span className="text-lg font-semibold">Hole {currentHole?.holeNumber}</span>
                <span className="text-sm ml-2">Enter Score</span>
              </Button>
            </div>

            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white hover:bg-white/20 px-2"
                onClick={() => {
                  // Navigate to extras tab which contains tools
                  const tabsTrigger = document.querySelector('[value="extras"]') as HTMLElement;
                  if (tabsTrigger) tabsTrigger.click();
                }}
              >
                <span className="text-xs">Tools</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Track Shot Button */}
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-10">
          <Button 
            className="bg-black/70 hover:bg-black/80 text-white border border-white/30 rounded-full px-6 py-2 backdrop-blur-sm"
            onClick={() => {
              const nextNumber = (currentHoleShots?.length || 0) + 1;
              toast({ title: `Tracking Shot ${nextNumber}`, description: 'Tap anywhere on the map to place it' });
              setMapPulse(true);
              setTimeout(() => setMapPulse(false), 1500);
              mapContainer.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
          >
            <Target className="w-4 h-4 mr-2" />
            Track Shot
          </Button>
        </div>
      </div>

      {/* Shot Summary */}
      {currentHoleShots.length > 0 && (
        <Card className="p-4">
          <h4 className="font-medium mb-3">Hole {currentHole?.holeNumber} Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <span className="text-muted-foreground">Total Shots:</span>
              <span className="ml-2 font-medium">{currentHoleShots.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Par:</span>
              <span className="ml-2 font-medium">{currentHole?.par}</span>
            </div>
          </div>
          
      {/* Shot List */}
      <div className="space-y-2">
        <h5 className="text-sm font-medium text-muted-foreground">Shots:</h5>
        {currentHoleShots.map((shot) => (
          <div 
            key={shot.id} 
            className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
              selectedShot === shot.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
            }`}
          >
            <div className="flex items-center gap-3 flex-1">
              <div 
                className={`w-8 h-8 rounded-full ${selectedShot === shot.id ? 'bg-primary' : 'bg-blue-500'} text-white flex items-center justify-center text-sm font-bold cursor-pointer hover:scale-105 transition-transform`}
                onClick={() => {
                  setSelectedShot(selectedShot === shot.id ? null : shot.id);
                  // Auto-trigger next shot tracking if this is Shot 1
                  if (shot.shotNumber === 1 && currentHoleShots.length === 1) {
                    toast({
                      title: "Ready for Shot 2",
                      description: "Click anywhere on the map to place your next shot"
                    });
                  }
                }}
              >
                {shot.shotNumber}
              </div>
              <div className="text-sm flex-1">
                <span className="font-medium">{shot.club}</span>
                <span className="text-muted-foreground ml-2">({shot.lie})</span>
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                {shot.distance}yd
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-1 ml-3">
              <Button 
                variant="ghost" 
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditShot(shot);
                }}
              >
                <Edit2 className="w-3 h-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteShot(shot.id);
                }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
        </Card>
      )}

      {/* Edit Shot Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="z-[9999]">
          <DialogHeader>
            <DialogTitle>Edit Shot {editingShot?.shotNumber}</DialogTitle>
          </DialogHeader>
          {editingShot && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Club</label>
                <Select 
                  value={editingShot.club} 
                  onValueChange={(value) => setEditingShot({...editingShot, club: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {clubs.map(club => (
                      <SelectItem key={club} value={club}>{club}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Lie</label>
                <Select 
                  value={editingShot.lie} 
                  onValueChange={(value) => setEditingShot({...editingShot, lie: value as Shot['lie']})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {lies.map(lie => (
                      <SelectItem key={lie} value={lie}>{lie}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}