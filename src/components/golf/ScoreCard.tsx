import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, Target, Flag } from "lucide-react";
import { ScoreEntry } from "@/types/golf";

interface ScoreCardProps {
  holes: ScoreEntry[];
  onScoreUpdate: (holeNumber: number, updates: Partial<ScoreEntry>) => void;
  currentHole?: number;
}

export function ScoreCard({ holes, onScoreUpdate, currentHole = 1 }: ScoreCardProps) {
  const [expandedHole, setExpandedHole] = useState<number | null>(currentHole);

  const updateScore = (holeNumber: number, field: keyof ScoreEntry, value: any) => {
    onScoreUpdate(holeNumber, { [field]: value });
  };

  const getTotalScore = () => {
    return holes.reduce((total, hole) => total + (hole.score || 0), 0);
  };

  const getTotalPar = () => {
    return holes.reduce((total, hole) => total + hole.par, 0);
  };

  const getScoreToPar = () => {
    const total = getTotalScore();
    const par = getTotalPar();
    const diff = total - par;
    if (diff === 0) return "E";
    return diff > 0 ? `+${diff}` : `${diff}`;
  };

  return (
    <div className="space-y-4">
      {/* Score Summary */}
      <Card className="p-4 bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">Total Score</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{getTotalScore()}</span>
              <Badge variant={getTotalScore() <= getTotalPar() ? "default" : "secondary"}>
                {getScoreToPar()}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Par {getTotalPar()}</p>
            <p className="text-lg font-semibold">{holes.filter(h => h.score).length} / {holes.length} holes</p>
          </div>
        </div>
      </Card>

      {/* Holes */}
      {holes.map((hole) => (
        <Card key={hole.holeNumber} className="overflow-hidden">
          <div 
            className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setExpandedHole(expandedHole === hole.holeNumber ? null : hole.holeNumber)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  hole.holeNumber === currentHole ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  {hole.holeNumber}
                </div>
                <div>
                  <p className="font-medium">Hole {hole.holeNumber}</p>
                  <p className="text-sm text-muted-foreground">Par {hole.par}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      const newScore = Math.max(1, (hole.score || hole.par) - 1);
                      updateScore(hole.holeNumber, 'score', newScore);
                    }}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <div className="w-12 text-center">
                    <span className="text-lg font-bold">{hole.score || '-'}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      const newScore = (hole.score || hole.par) + 1;
                      updateScore(hole.holeNumber, 'score', newScore);
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                {hole.score && (
                  <Badge variant={hole.score <= hole.par ? "default" : "secondary"}>
                    {hole.score - hole.par === 0 ? 'E' : 
                     hole.score - hole.par > 0 ? `+${hole.score - hole.par}` : 
                     `${hole.score - hole.par}`}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {expandedHole === hole.holeNumber && (
            <div className="border-t p-4 bg-muted/20">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-1">Putts</label>
                  <Input
                    type="number"
                    value={hole.putts || ''}
                    onChange={(e) => updateScore(hole.holeNumber, 'putts', parseInt(e.target.value) || undefined)}
                    min="0"
                    max="10"
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Button
                    variant={hole.fairwayHit ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateScore(hole.holeNumber, 'fairwayHit', !hole.fairwayHit)}
                    className="w-full"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Fairway Hit
                  </Button>
                  
                  <Button
                    variant={hole.greenInRegulation ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateScore(hole.holeNumber, 'greenInRegulation', !hole.greenInRegulation)}
                    className="w-full"
                  >
                    <Flag className="w-4 h-4 mr-2" />
                    Green in Regulation
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}