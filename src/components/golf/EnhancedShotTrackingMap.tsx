import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { 
  MapPin, Target, Layers, BarChart3, 
  Palette, Mountain, Eye, Settings 
} from "lucide-react";
import { Hole } from "@/types/golf";
import { Shot } from "@/types/shot";
import { CourseFeature } from "@/types/course-features";
import { CourseDesigner } from "./CourseDesigner";
import { Course3DViewer } from "./Course3DViewer";
import { ShotAnalytics } from "./ShotAnalytics";
import { generateHeatMapData } from "@/utils/shot-analytics";
import { useToast } from "@/hooks/use-toast";

// Fix default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface EnhancedShotTrackingMapProps {
  currentHole?: Hole;
  holes: Hole[];
  shots: Shot[];
  features: CourseFeature[];
  onShotAdd: (shot: Omit<Shot, 'id' | 'timestamp'>) => void;
  onShotDelete: (shotId: string) => void;
  onFeatureAdd: (feature: Omit<CourseFeature, 'id'>) => void;
  onFeatureUpdate: (id: string, feature: Partial<CourseFeature>) => void;
  onFeatureDelete: (id: string) => void;
}

export function EnhancedShotTrackingMap({ 
  currentHole, 
  holes,
  shots, 
  features,
  onShotAdd, 
  onShotDelete,
  onFeatureAdd,
  onFeatureUpdate,
  onFeatureDelete
}: EnhancedShotTrackingMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  
  // Enhanced visualization controls
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showFeatures, setShowFeatures] = useState(true);
  const [showSatellite, setShowSatellite] = useState(true);
  const [showTrajectories, setShowTrajectories] = useState(true);
  const [heatmapOpacity, setHeatmapOpacity] = useState([0.6]);
  const [selectedFeatureTypes, setSelectedFeatureTypes] = useState<string[]>(['all']);
  
  const { toast } = useToast();

  const createCustomIcon = (color: string, size: number = 20) => {
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [size, size],
      iconAnchor: [size/2, size/2]
    });
  };

  const initializeEnhancedMap = () => {
    if (!mapContainer.current || !currentHole) return;

    // Create map
    map.current = L.map(mapContainer.current).setView(
      [currentHole.teeCoords.lat, currentHole.teeCoords.lng], 
      16
    );

    // Add tile layers
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; Esri &copy; OpenStreetMap contributors',
      maxZoom: 19
    });

    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    });

    // Add default layer
    if (showSatellite) {
      satelliteLayer.addTo(map.current);
    } else {
      streetLayer.addTo(map.current);
    }

    // Layer control
    const baseMaps = {
      "Satellite": satelliteLayer,
      "Street": streetLayer
    };
    L.control.layers(baseMaps).addTo(map.current);

    // Add base markers
    addBaseMarkers();
    
    // Add enhanced features
    if (showFeatures) addCourseFeatures();
    if (showHeatmap) addHeatmapLayer();
    if (showTrajectories) addShotTrajectories();
  };

  const addBaseMarkers = () => {
    if (!map.current || !currentHole) return;

    // Tee marker
    const teeIcon = createCustomIcon('#22c55e', 24);
    L.marker([currentHole.teeCoords.lat, currentHole.teeCoords.lng], { icon: teeIcon })
      .addTo(map.current!)
      .bindPopup(`
        <div class="p-3">
          <div class="flex items-center justify-between mb-2">
            <strong>Hole ${currentHole.holeNumber} Tee</strong>
            <span class="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Par ${currentHole.par}</span>
          </div>
          <p class="text-sm text-gray-600">${currentHole.distance} yards</p>
        </div>
      `);

    // Green marker
    const greenIcon = createCustomIcon('#ef4444', 24);
    L.marker([currentHole.greenCoords.lat, currentHole.greenCoords.lng], { icon: greenIcon })
      .addTo(map.current!)
      .bindPopup(`
        <div class="p-3">
          <strong>Hole ${currentHole.holeNumber} Green</strong>
          <p class="text-sm text-gray-600 mt-1">Target destination</p>
        </div>
      `);

    // Shot markers
    const currentHoleShots = shots.filter(s => s.holeNumber === currentHole.holeNumber);
    currentHoleShots.forEach((shot) => {
      const shotIcon = createCustomIcon(getShotColor(shot.lie), 16);
      L.marker([shot.coordinates.lat, shot.coordinates.lng], { icon: shotIcon })
        .addTo(map.current!)
        .bindPopup(`
          <div class="p-3">
            <div class="flex items-center justify-between mb-2">
              <strong>Shot ${shot.shotNumber}</strong>
              <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">${shot.lie}</span>
            </div>
            <div class="space-y-1 text-sm">
              <div class="flex justify-between">
                <span>Club:</span>
                <span class="font-medium">${shot.club}</span>
              </div>
              <div class="flex justify-between">
                <span>Distance to green:</span>
                <span class="font-medium">${shot.distance} yds</span>
              </div>
            </div>
          </div>
        `);
    });
  };

  const addCourseFeatures = () => {
    if (!map.current || !currentHole) return;

    const holeFeatures = features.filter(f => f.holeNumber === currentHole.holeNumber);
    
    holeFeatures.forEach(feature => {
      if (selectedFeatureTypes.includes('all') || selectedFeatureTypes.includes(feature.type)) {
        const color = getFeatureColor(feature.type);
        const coordinates = feature.coordinates;
        
        if (coordinates.length === 1) {
          const featureIcon = createCustomIcon(color, 12);
          L.marker([coordinates[0].lat, coordinates[0].lng], { icon: featureIcon })
            .addTo(map.current!)
            .bindPopup(`
              <div class="p-2">
                <strong>${feature.name || feature.type}</strong>
                ${feature.notes ? `<p class="text-sm mt-1">${feature.notes}</p>` : ''}
              </div>
            `);
        }
      }
    });
  };

  const addHeatmapLayer = () => {
    // Leaflet heatmap would require additional plugin
    // For now, we'll show shot density with circles
    if (!map.current) return;

    const heatmapData = generateHeatMapData(shots, 30);
    
    heatmapData.forEach(point => {
      L.circle([point.lat, point.lng], {
        radius: point.intensity * 10,
        fillColor: '#ff7800',
        color: '#ff7800',
        weight: 1,
        opacity: heatmapOpacity[0],
        fillOpacity: heatmapOpacity[0] * 0.5
      }).addTo(map.current!)
        .bindPopup(`Shot density: ${point.shotCount} shots`);
    });
  };

  const addShotTrajectories = () => {
    if (!map.current || !currentHole) return;

    const currentHoleShots = shots
      .filter(s => s.holeNumber === currentHole.holeNumber)
      .sort((a, b) => a.shotNumber - b.shotNumber);

    if (currentHoleShots.length < 2) return;

    const trajectoryPoints = currentHoleShots.map(shot => [shot.coordinates.lat, shot.coordinates.lng] as [number, number]);
    
    L.polyline(trajectoryPoints, {
      color: '#3b82f6',
      weight: 3,
      opacity: 0.7,
      dashArray: '5, 10'
    }).addTo(map.current!)
      .bindPopup(`Shot trajectory for hole ${currentHole.holeNumber}`);
  };

  const getShotColor = (lie: string): string => {
    const colors = {
      'tee': '#22c55e',
      'fairway': '#3b82f6',
      'rough': '#f59e0b',
      'sand': '#fbbf24',
      'green': '#10b981'
    };
    return colors[lie as keyof typeof colors] || '#6b7280';
  };

  const getFeatureColor = (type: string): string => {
    const colors = {
      'fairway': '#22c55e',
      'rough': '#84cc16',
      'sand': '#fbbf24',
      'water': '#3b82f6',
      'tree': '#16a34a',
      'building': '#6b7280',
      'cart-path': '#f3f4f6'
    };
    return colors[type as keyof typeof colors] || '#6b7280';
  };

  useEffect(() => {
    if (currentHole) {
      if (map.current) {
        map.current.remove();
      }
      initializeEnhancedMap();
    }

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [currentHole, showSatellite]);

  // Update visualization layers when controls change
  useEffect(() => {
    if (map.current && currentHole) {
      // Clear and re-add layers
      map.current.eachLayer((layer) => {
        if (layer instanceof L.Circle || layer instanceof L.Polyline) {
          map.current!.removeLayer(layer);
        }
      });
      
      if (showHeatmap) addHeatmapLayer();
      if (showTrajectories) addShotTrajectories();
    }
  }, [showHeatmap, showTrajectories, heatmapOpacity]);

  const currentHoleShots = shots.filter(s => currentHole && s.holeNumber === currentHole.holeNumber);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Target className="w-5 h-5" />
            Enhanced Golf Course Mapping
          </h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{currentHoleShots.length} shots</Badge>
            <Badge variant="outline">{features.filter(f => currentHole && f.holeNumber === currentHole.holeNumber).length} features</Badge>
          </div>
        </div>

        <Tabs defaultValue="map" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="map">Interactive Map</TabsTrigger>
            <TabsTrigger value="designer">Course Designer</TabsTrigger>
            <TabsTrigger value="3d">3D Viewer</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="space-y-4">
            {/* Map Controls */}
            <Card className="p-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Map Controls
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Heat Map</label>
                    <Switch checked={showHeatmap} onCheckedChange={setShowHeatmap} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Course Features</label>
                    <Switch checked={showFeatures} onCheckedChange={setShowFeatures} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Shot Trajectories</label>
                    <Switch checked={showTrajectories} onCheckedChange={setShowTrajectories} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Satellite View</label>
                    <Switch checked={showSatellite} onCheckedChange={setShowSatellite} />
                  </div>
                </div>

                <div className="space-y-3">
                  {showHeatmap && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Heatmap Opacity</label>
                      <Slider
                        value={heatmapOpacity}
                        onValueChange={setHeatmapOpacity}
                        max={1}
                        min={0.1}
                        step={0.1}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Interactive Map */}
            <Card className="overflow-hidden">
              <div ref={mapContainer} className="h-96 w-full" />
              <div className="p-4 border-t bg-muted/30">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>🆓 Free OpenStreetMap • No API keys required</span>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Tee</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span>Green</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Shots</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="designer">
            <CourseDesigner
              currentHole={currentHole}
              features={features}
              onFeatureAdd={onFeatureAdd}
              onFeatureUpdate={onFeatureUpdate}
              onFeatureDelete={onFeatureDelete}
            />
          </TabsContent>

          <TabsContent value="3d">
            <Course3DViewer
              currentHole={currentHole}
              shots={shots}
              features={features}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <ShotAnalytics
              shots={shots}
              holes={holes}
              currentHole={currentHole}
            />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}