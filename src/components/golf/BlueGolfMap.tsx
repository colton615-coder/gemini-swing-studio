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
  onShotEdit?: (shotId: string, updates: Partial<Shot>) => void;
}

export function BlueGolfMap({ 
  currentHole, 
  shots, 
  onShotAdd, 
  onShotUpdate, 
  onShotDelete,
  onShotEdit 
}: BlueGolfMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markersLayer = useRef<L.LayerGroup | null>(null);
  const trajectoryLayer = useRef<L.LayerGroup | null>(null);
  const [selectedShot, setSelectedShot] = useState<string | null>(null);
  const [editingShot, setEditingShot] = useState<Shot | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const clubs = ['Driver', '3-Wood', '5-Wood', '3-Iron', '4-Iron', '5-Iron', '6-Iron', '7-Iron', '8-Iron', '9-Iron', 'PW', 'SW', 'Putter'];
  const lies = ['tee', 'fairway', 'rough', 'sand', 'green'] as const;

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

    // Create map with 2D flat view
    map.current = L.map(mapContainer.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([currentHole.teeCoords.lat, currentHole.teeCoords.lng], 17);

    // Add flat 2D tiles (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
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
      if (currentHoleShots.length === 0) {
        // First shot - distance from tee
        distance = calculateDistance(
          { lat: e.latlng.lat, lng: e.latlng.lng },
          currentHole.teeCoords
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
  }, [shots, selectedShot]);

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
      <Card className="overflow-hidden bg-black relative z-0">
        <div ref={mapContainer} className="h-[500px] w-full relative z-0" />
        
      {/* Map Controls */}
        <div className="p-3 bg-background border-t">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full border border-white"></div>
                <span>Tee</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full border border-white"></div>
                <span>Green</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full border border-white"></div>
                <span>Shots</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-6 h-0.5 bg-yellow-400"></div>
                <span>Path</span>
              </div>
            </div>
            
            {selectedShotData && (
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEditShot(selectedShotData)}
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleDeleteShot(selectedShot!)}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

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
                className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors ${
                  selectedShot === shot.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedShot(selectedShot === shot.id ? null : shot.id)}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full ${selectedShot === shot.id ? 'bg-primary' : 'bg-blue-500'} text-white flex items-center justify-center text-xs font-bold`}>
                    {shot.shotNumber}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">{shot.club}</span>
                    <span className="text-muted-foreground ml-2">({shot.lie})</span>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {shot.distance}yd
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