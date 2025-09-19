import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
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
  const map = useRef<mapboxgl.Map | null>(null);
  const mapboxToken = 'pk.eyJ1IjoiY29sdG9uNjE1IiwiYSI6ImNtZTkyd3ZjbzBmeXAycXFhdXMwYW1hZ28ifQ.s_B7gcqGC9aoAdV418nsOg';
  
  // Enhanced visualization controls
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showFeatures, setShowFeatures] = useState(true);
  const [showElevation, setShowElevation] = useState(false);
  const [showTrajectories, setShowTrajectories] = useState(true);
  const [heatmapOpacity, setHeatmapOpacity] = useState([0.6]);
  const [selectedFeatureTypes, setSelectedFeatureTypes] = useState<string[]>(['all']);
  
  const { toast } = useToast();

  const initializeEnhancedMap = () => {
    if (!mapContainer.current || !currentHole) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-v9',
      center: [currentHole.teeCoords.lng, currentHole.teeCoords.lat],
      zoom: 16,
      pitch: 45,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    map.current.on('load', () => {
      if (!map.current || !currentHole) return;

      // Add base markers
      addBaseMarkers();
      
      // Add enhanced features
      if (showFeatures) addCourseFeatures();
      if (showHeatmap) addHeatmapLayer();
      if (showTrajectories) addShotTrajectories();
      if (showElevation) addElevationContours();
    });
  };

  const addBaseMarkers = () => {
    if (!map.current || !currentHole) return;

    // Tee marker with enhanced popup
    new mapboxgl.Marker({ color: '#22c55e', scale: 1.2 })
      .setLngLat([currentHole.teeCoords.lng, currentHole.teeCoords.lat])
      .setPopup(new mapboxgl.Popup().setHTML(`
        <div class="p-3">
          <div class="flex items-center justify-between mb-2">
            <strong>Hole ${currentHole.holeNumber} Tee</strong>
            <span class="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Par ${currentHole.par}</span>
          </div>
          <p class="text-sm text-gray-600">${currentHole.distance} yards</p>
          <p class="text-xs text-gray-500 mt-1">Par ${currentHole.par} • ${currentHole.distance} yards</p>
        </div>
      `))
      .addTo(map.current);

    // Green marker with enhanced popup
    new mapboxgl.Marker({ color: '#ef4444', scale: 1.2 })
      .setLngLat([currentHole.greenCoords.lng, currentHole.greenCoords.lat])
      .setPopup(new mapboxgl.Popup().setHTML(`
        <div class="p-3">
          <strong>Hole ${currentHole.holeNumber} Green</strong>
          <p class="text-sm text-gray-600 mt-1">Target destination</p>
        </div>
      `))
      .addTo(map.current);

    // Enhanced shot markers
    const currentHoleShots = shots.filter(s => s.holeNumber === currentHole.holeNumber);
    currentHoleShots.forEach((shot, index) => {
      const marker = new mapboxgl.Marker({ 
        color: getShotColor(shot.lie), 
        scale: 0.8 
      })
      .setLngLat([shot.coordinates.lng, shot.coordinates.lat])
      .setPopup(new mapboxgl.Popup().setHTML(`
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
      `))
      .addTo(map.current!);
    });
  };

  const addCourseFeatures = () => {
    if (!map.current || !currentHole) return;

    const holeFeatures = features.filter(f => f.holeNumber === currentHole.holeNumber);
    
    holeFeatures.forEach(feature => {
      if (selectedFeatureTypes.includes('all') || selectedFeatureTypes.includes(feature.type)) {
        // Add feature visualization based on type
        const color = getFeatureColor(feature.type);
        const coordinates = feature.coordinates;
        
        if (coordinates.length === 1) {
          // Point feature (tree, building)
          new mapboxgl.Marker({ color, scale: 0.6 })
            .setLngLat([coordinates[0].lng, coordinates[0].lat])
            .setPopup(new mapboxgl.Popup().setHTML(`
              <div class="p-2">
                <strong>${feature.name || feature.type}</strong>
                ${feature.notes ? `<p class="text-sm mt-1">${feature.notes}</p>` : ''}
              </div>
            `))
            .addTo(map.current!);
        }
        // Area features would require more complex GeoJSON implementation
      }
    });
  };

  const addHeatmapLayer = () => {
    if (!map.current) return;

    const heatmapData = generateHeatMapData(shots, 30);
    
    // Convert to GeoJSON format
    const geojson = {
      type: 'FeatureCollection' as const,
      features: heatmapData.map(point => ({
        type: 'Feature' as const,
        properties: {
          intensity: point.intensity,
          shotCount: point.shotCount
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [point.lng, point.lat]
        }
      }))
    };

    map.current.addSource('heatmap', {
      type: 'geojson',
      data: geojson
    });

    map.current.addLayer({
      id: 'heatmap-layer',
      type: 'heatmap',
      source: 'heatmap',
      paint: {
        'heatmap-weight': ['interpolate', ['linear'], ['get', 'intensity'], 0, 0, 10, 1],
        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 18, 3],
        'heatmap-color': [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0, 'rgba(33,102,172,0)',
          0.2, 'rgb(103,169,207)',
          0.4, 'rgb(209,229,240)',
          0.6, 'rgb(253,219,199)',
          0.8, 'rgb(239,138,98)',
          1, 'rgb(178,24,43)'
        ],
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 18, 20],
        'heatmap-opacity': heatmapOpacity[0]
      }
    });
  };

  const addShotTrajectories = () => {
    // Implementation for shot trajectory lines
    // Would connect shots in sequence for each hole
  };

  const addElevationContours = () => {
    // Implementation for elevation contour lines
    // Would require elevation data integration
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
  }, [currentHole]);

  // Update visualization layers when controls change
  useEffect(() => {
    if (!map.current) return;

    if (showHeatmap && !map.current.getLayer('heatmap-layer')) {
      addHeatmapLayer();
    } else if (!showHeatmap && map.current.getLayer('heatmap-layer')) {
      map.current.removeLayer('heatmap-layer');
      map.current.removeSource('heatmap');
    }

    if (map.current.getLayer('heatmap-layer')) {
      map.current.setPaintProperty('heatmap-layer', 'heatmap-opacity', heatmapOpacity[0]);
    }
  }, [showHeatmap, heatmapOpacity]);

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
                    <label className="text-sm font-medium">Elevation Lines</label>
                    <Switch checked={showElevation} onCheckedChange={setShowElevation} />
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
                  <span>Interactive course mapping with advanced visualization</span>
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