import React, { Suspense, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Line } from '@react-three/drei';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, Pause, RotateCcw, Eye, Mountain, 
  Navigation, Zap, Target 
} from "lucide-react";
import { Hole } from "@/types/golf";
import { Shot } from "@/types/shot";
import { CourseFeature, HoleElevation } from "@/types/course-features";
import * as THREE from 'three';

interface Course3DViewerProps {
  currentHole?: Hole;
  shots: Shot[];
  features: CourseFeature[];
  elevation?: HoleElevation;
}

// 3D Hole Component
function Hole3D({ hole, shots, features, elevation }: { 
  hole: Hole; 
  shots: Shot[]; 
  features: CourseFeature[];
  elevation?: HoleElevation;
}) {
  const holeShots = shots.filter(s => s.holeNumber === hole.holeNumber);
  const holeFeatures = features.filter(f => f.holeNumber === hole.holeNumber);

  // Create terrain mesh from elevation data
  const createTerrain = () => {
    if (!elevation) return null;
    
    const geometry = new THREE.PlaneGeometry(400, 600, 32, 48);
    const vertices = geometry.attributes.position.array as Float32Array;
    
    // Apply elevation data to vertices
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const y = vertices[i + 1];
      // Simple elevation simulation
      vertices[i + 2] = Math.sin(x * 0.01) * Math.cos(y * 0.01) * 5;
    }
    
    geometry.attributes.position.needsUpdate = true;
    
    return (
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
        <primitive object={geometry} />
        <meshLambertMaterial color="#4ade80" wireframe={false} />
      </mesh>
    );
  };

  return (
    <group>
      {/* Terrain */}
      {createTerrain()}
      
      {/* Tee Box */}
      <mesh position={[-180, 0, 0]}>
        <boxGeometry args={[20, 2, 30]} />
        <meshLambertMaterial color="#22c55e" />
      </mesh>
      <Text
        position={[-180, 5, 0]}
        fontSize={8}
        color="#000"
        anchorX="center"
        anchorY="middle"
      >
        Tee {hole.holeNumber}
      </Text>

      {/* Green */}
      <mesh position={[180, 0, 0]}>
        <cylinderGeometry args={[25, 25, 1, 32]} />
        <meshLambertMaterial color="#15803d" />
      </mesh>
      <Text
        position={[180, 5, 0]}
        fontSize={8}
        color="#000"
        anchorX="center"
        anchorY="middle"
      >
        Green Par {hole.par}
      </Text>

      {/* Pin */}
      <mesh position={[180, 5, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 10]} />
        <meshLambertMaterial color="#dc2626" />
      </mesh>

      {/* Shot Markers */}
      {holeShots.map((shot, index) => {
        const x = -180 + (360 * (index + 1) / (holeShots.length + 1));
        return (
          <group key={shot.id} position={[x, 2, 0]}>
            <mesh>
              <sphereGeometry args={[2]} />
              <meshLambertMaterial color="#3b82f6" />
            </mesh>
            <Text
              position={[0, 5, 0]}
              fontSize={4}
              color="#000"
              anchorX="center"
              anchorY="middle"
            >
              {shot.club}
            </Text>
          </group>
        );
      })}

      {/* Shot Trajectory Lines */}
      {holeShots.length > 0 && (
            <Line
              points={[
                new THREE.Vector3(-180, 2, 0), // Start at tee
                ...holeShots.map((_, index) => {
                  const x = -180 + (360 * (index + 1) / (holeShots.length + 1));
                  return new THREE.Vector3(x, 8, 0); // Arc height
                }),
                new THREE.Vector3(180, 2, 0) // End at green
              ]}
              color="#3b82f6"
            />
      )}

      {/* Course Features */}
      {holeFeatures.map((feature) => {
        const x = Math.random() * 300 - 150; // Random positioning for demo
        const z = Math.random() * 100 - 50;
        
        switch (feature.type) {
          case 'sand':
            return (
              <mesh key={feature.id} position={[x, -1, z]}>
                <cylinderGeometry args={[15, 15, 1, 8]} />
                <meshLambertMaterial color="#fbbf24" />
              </mesh>
            );
          case 'water':
            return (
              <mesh key={feature.id} position={[x, -1, z]}>
                <cylinderGeometry args={[20, 20, 1, 16]} />
                <meshLambertMaterial color="#3b82f6" />
              </mesh>
            );
          case 'tree':
            return (
              <group key={feature.id} position={[x, 0, z]}>
                {/* Trunk */}
                <mesh position={[0, 5, 0]}>
                  <cylinderGeometry args={[1, 1, 10]} />
                  <meshLambertMaterial color="#92400e" />
                </mesh>
                {/* Foliage */}
                <mesh position={[0, 12, 0]}>
                  <sphereGeometry args={[6]} />
                  <meshLambertMaterial color="#16a34a" />
                </mesh>
              </group>
            );
          default:
            return null;
        }
      })}
    </group>
  );
}

export function Course3DViewer({ currentHole, shots, features, elevation }: Course3DViewerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTrajectory, setShowTrajectory] = useState(true);
  const [showElevation, setShowElevation] = useState(true);
  const [cameraHeight, setCameraHeight] = useState([50]);
  const [flyoverSpeed, setFlyoverSpeed] = useState([1]);
  const controlsRef = useRef<any>();

  const handleResetView = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const handleFlyover = () => {
    setIsPlaying(!isPlaying);
    // Implement flyover animation logic
  };

  if (!currentHole) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-4">
          <Mountain className="w-12 h-12 mx-auto text-muted-foreground" />
          <h3 className="text-lg font-semibold">3D Course Viewer</h3>
          <p className="text-muted-foreground">
            Select a hole to view it in 3D
          </p>
        </div>
      </Card>
    );
  }

  const currentHoleShots = shots.filter(s => s.holeNumber === currentHole.holeNumber);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Mountain className="w-5 h-5" />
            3D Course Viewer - Hole {currentHole.holeNumber}
          </h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Par {currentHole.par}</Badge>
            <Badge variant="outline">{currentHoleShots.length} shots</Badge>
          </div>
        </div>

        <Tabs defaultValue="view" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="view">3D View</TabsTrigger>
            <TabsTrigger value="flyover">Flyover</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="view" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="trajectory"
                  checked={showTrajectory}
                  onCheckedChange={setShowTrajectory}
                />
                <label htmlFor="trajectory" className="text-sm font-medium">
                  Show Shot Trajectory
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="elevation"
                  checked={showElevation}
                  onCheckedChange={setShowElevation}
                />
                <label htmlFor="elevation" className="text-sm font-medium">
                  Show Elevation
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Camera Height</label>
              <Slider
                value={cameraHeight}
                onValueChange={setCameraHeight}
                max={100}
                min={10}
                step={5}
                className="w-full"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleResetView}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset View
              </Button>
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                Top View
              </Button>
              <Button variant="outline" size="sm">
                <Navigation className="w-4 h-4 mr-2" />
                Side View
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="flyover" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Flyover Speed</label>
                <Slider
                  value={flyoverSpeed}
                  onValueChange={setFlyoverSpeed}
                  max={3}
                  min={0.5}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleFlyover} className="flex-1">
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Pause Flyover
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Start Flyover
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Hole Statistics</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Distance:</span>
                    <span>{currentHole.distance} yards</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Par:</span>
                    <span>{currentHole.par}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shots Played:</span>
                    <span>{currentHoleShots.length}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Course Features</h4>
                <div className="space-y-1 text-sm">
                  {features.filter(f => f.holeNumber === currentHole.holeNumber).map((feature) => (
                    <div key={feature.id} className="flex justify-between">
                      <span className="capitalize">{feature.type}:</span>
                      <span>{feature.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* 3D Canvas */}
      <Card className="overflow-hidden">
        <div className="h-96">
          <Canvas
            camera={{ 
              position: [0, cameraHeight[0], 200], 
              fov: 75 
            }}
          >
            <Suspense fallback={null}>
              {/* Lighting */}
              <ambientLight intensity={0.6} />
              <directionalLight 
                position={[100, 100, 50]} 
                intensity={1}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
              />
              
              {/* 3D Hole */}
              <Hole3D 
                hole={currentHole}
                shots={currentHoleShots}
                features={features}
                elevation={elevation}
              />
              
              {/* Controls */}
              <OrbitControls 
                ref={controlsRef}
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                maxPolarAngle={Math.PI / 2}
              />
            </Suspense>
          </Canvas>
        </div>
        
        <div className="p-4 border-t bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            Click and drag to rotate • Scroll to zoom • Right-click and drag to pan
          </p>
        </div>
      </Card>
    </div>
  );
}