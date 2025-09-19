import React, { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, Circle, Polygon, Path } from 'fabric';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Pencil, Square, Circle as CircleIcon, MapPin, Trees, 
  Waves, Mountain, Save, Undo, Redo, Trash2 
} from "lucide-react";
import { CourseFeature } from "@/types/course-features";
import { Hole } from "@/types/golf";
import { useToast } from "@/hooks/use-toast";

interface CourseDesignerProps {
  currentHole?: Hole;
  features: CourseFeature[];
  onFeatureAdd: (feature: Omit<CourseFeature, 'id'>) => void;
  onFeatureUpdate: (id: string, feature: Partial<CourseFeature>) => void;
  onFeatureDelete: (id: string) => void;
}

type DrawingTool = 'select' | 'fairway' | 'rough' | 'sand' | 'water' | 'tree' | 'building' | 'cart-path';

export function CourseDesigner({ currentHole, features, onFeatureAdd, onFeatureUpdate, onFeatureDelete }: CourseDesignerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState<DrawingTool>('select');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<any[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<CourseFeature | null>(null);
  const [featureName, setFeatureName] = useState('');
  const [featureNotes, setFeatureNotes] = useState('');
  const { toast } = useToast();

  const toolColors = {
    fairway: '#22c55e',
    rough: '#84cc16',
    sand: '#fbbf24',
    water: '#3b82f6',
    tree: '#16a34a',
    building: '#6b7280',
    'cart-path': '#f3f4f6'
  };

  const tools = [
    { id: 'select' as const, name: 'Select', icon: MapPin },
    { id: 'fairway' as const, name: 'Fairway', icon: Mountain },
    { id: 'rough' as const, name: 'Rough', icon: Trees },
    { id: 'sand' as const, name: 'Sand', icon: CircleIcon },
    { id: 'water' as const, name: 'Water', icon: Waves },
    { id: 'tree' as const, name: 'Trees', icon: Trees },
    { id: 'building' as const, name: 'Building', icon: Square },
    { id: 'cart-path' as const, name: 'Cart Path', icon: Square }
  ];

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#f8fafc',
    });

    // Set up drawing mode
    canvas.freeDrawingBrush.color = toolColors.fairway;
    canvas.freeDrawingBrush.width = 5;

    setFabricCanvas(canvas);

    // Handle path creation for area features
    canvas.on('path:created', (e) => {
      if (activeTool !== 'select' && activeTool !== 'tree') {
        const path = e.path;
        if (path && currentHole) {
          // Convert fabric path to coordinates (simplified for demo)
          const pathString = 'path-data';
          const feature: Omit<CourseFeature, 'id'> = {
            type: activeTool as any,
            name: featureName || `${activeTool} ${features.length + 1}`,
            coordinates: [], // Would need to parse path coordinates
            holeNumber: currentHole.holeNumber,
            notes: featureNotes
          };
          
          onFeatureAdd(feature);
          toast({
            title: "Feature Added",
            description: `${activeTool} feature created`
          });
        }
      }
    });

    // Handle click for point features (trees, buildings)
    canvas.on('mouse:down', (e) => {
      if ((activeTool === 'tree' || activeTool === 'building') && e.pointer && currentHole) {
        const circle = new Circle({
          left: e.pointer.x - 10,
          top: e.pointer.y - 10,
          radius: 10,
          fill: toolColors[activeTool],
          stroke: '#000',
          strokeWidth: 1
        });

        canvas.add(circle);

        const feature: Omit<CourseFeature, 'id'> = {
          type: activeTool,
          name: featureName || `${activeTool} ${features.length + 1}`,
          coordinates: [{
            lat: 0, // Would need to convert canvas coords to GPS
            lng: 0
          }],
          holeNumber: currentHole.holeNumber,
          notes: featureNotes
        };

        onFeatureAdd(feature);
        toast({
          title: "Feature Added",
          description: `${activeTool} added to hole ${currentHole.holeNumber}`
        });
      }
    });

    return () => {
      canvas.dispose();
    };
  }, []);

  useEffect(() => {
    if (!fabricCanvas) return;

    fabricCanvas.isDrawingMode = activeTool !== 'select' && activeTool !== 'tree' && activeTool !== 'building';
    
    if (fabricCanvas.freeDrawingBrush && activeTool in toolColors) {
      fabricCanvas.freeDrawingBrush.color = toolColors[activeTool as keyof typeof toolColors];
    }
  }, [activeTool, fabricCanvas]);

  const handleToolClick = (tool: DrawingTool) => {
    setActiveTool(tool);
    setSelectedFeature(null);
  };

  const handleClear = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = '#f8fafc';
    fabricCanvas.renderAll();
    toast({
      title: "Canvas Cleared",
      description: "All drawings have been cleared"
    });
  };

  const handleSave = () => {
    if (!fabricCanvas || !currentHole) return;
    
    // In a real implementation, you'd save the canvas state
    toast({
      title: "Design Saved",
      description: `Course design for hole ${currentHole.holeNumber} saved`
    });
  };

  const currentHoleFeatures = features.filter(f => currentHole && f.holeNumber === currentHole.holeNumber);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Pencil className="w-5 h-5" />
            Course Designer
          </h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleClear}>
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Design
            </Button>
          </div>
        </div>

        <Tabs defaultValue="tools" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tools">Drawing Tools</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="properties">Properties</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tools" className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              {tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <Button
                    key={tool.id}
                    variant={activeTool === tool.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleToolClick(tool.id)}
                    className="flex flex-col gap-1 h-16"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-xs">{tool.name}</span>
                  </Button>
                );
              })}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1">Feature Name</label>
                <Input
                  placeholder="Optional name..."
                  value={featureName}
                  onChange={(e) => setFeatureName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Notes</label>
                <Input
                  placeholder="Optional notes..."
                  value={featureNotes}
                  onChange={(e) => setFeatureNotes(e.target.value)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="features" className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Hole Features</span>
                <Badge variant="outline">{currentHoleFeatures.length} features</Badge>
              </div>
              
              {currentHoleFeatures.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No features created yet. Use the drawing tools to add course features.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {currentHoleFeatures.map((feature) => (
                    <div key={feature.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: toolColors[feature.type as keyof typeof toolColors] || '#gray' }}
                        />
                        <div>
                          <p className="font-medium">{feature.name}</p>
                          <p className="text-sm text-muted-foreground capitalize">{feature.type}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onFeatureDelete(feature.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="properties" className="space-y-4">
            {selectedFeature ? (
              <div className="space-y-4">
                <h4 className="font-medium">Edit Feature</h4>
                {/* Feature editing form would go here */}
                <p className="text-sm text-muted-foreground">
                  Feature editing interface would be implemented here.
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Select a feature to edit its properties.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </Card>

      {/* Drawing Canvas */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {currentHole ? `Hole ${currentHole.holeNumber} Designer` : 'Select a hole to start designing'}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Tool: <Badge variant="outline" className="capitalize">{activeTool}</Badge>
              </span>
            </div>
          </div>
        </div>
        <div className="flex justify-center p-4">
          <canvas ref={canvasRef} className="border border-border rounded-lg shadow-sm" />
        </div>
        <div className="p-4 border-t bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            {activeTool === 'select' && 'Click to select and edit features'}
            {(activeTool === 'tree' || activeTool === 'building') && 'Click to place point features'}
            {!['select', 'tree', 'building'].includes(activeTool) && 'Click and drag to draw area features'}
          </p>
        </div>
      </Card>
    </div>
  );
}