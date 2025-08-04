import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Mountain, 
  Layers, 
  Atom, 
  Hammer, 
  MapPin, 
  Lightbulb,
  AlertCircle 
} from 'lucide-react';

export interface RockIdentification {
  rockName: string;
  type: 'Igneous' | 'Sedimentary' | 'Metamorphic';
  composition: string[];
  hardness: string;
  formation: string;
  commonLocations: string[];
  funFact: string;
  confidence: number;
}

interface RockResultsProps {
  results: RockIdentification;
  analysisImage?: string;
}

const RockResults: React.FC<RockResultsProps> = ({ results, analysisImage }) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Igneous':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'Sedimentary':
        return 'bg-sandstone/20 text-iron border-sandstone/40';
      case 'Metamorphic':
        return 'bg-slate/20 text-granite border-slate/40';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-orange-600';
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header Card */}
      <Card className="border-2 border-copper/20 bg-gradient-to-br from-limestone/30 to-quartz/20">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Mountain className="h-8 w-8 text-copper" />
            <CardTitle className="text-3xl font-bold text-foreground">
              {results.rockName}
            </CardTitle>
          </div>
          <div className="flex items-center justify-center gap-4">
            <Badge variant="outline" className={getTypeColor(results.type)}>
              <Layers className="h-4 w-4 mr-1" />
              {results.type}
            </Badge>
            <div className="flex items-center gap-1 text-sm">
              <span className="text-muted-foreground">Confidence:</span>
              <span className={`font-semibold ${getConfidenceColor(results.confidence)}`}>
                {results.confidence}%
              </span>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Image Display */}
        {analysisImage && (
          <Card>
            <CardContent className="p-6">
              <img
                src={analysisImage}
                alt="Analyzed rock specimen"
                className="w-full rounded-lg shadow-md"
              />
            </CardContent>
          </Card>
        )}

        {/* Key Properties */}
        <div className="space-y-6">
          {/* Composition */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Atom className="h-5 w-5 text-copper" />
                Composition
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {results.composition.map((mineral, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {mineral}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Hardness */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Hammer className="h-5 w-5 text-slate" />
                Hardness
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground font-medium">{results.hardness}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Formation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mountain className="h-5 w-5 text-iron" />
            Formation Process
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground leading-relaxed">{results.formation}</p>
        </CardContent>
      </Card>

      {/* Locations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-granite" />
            Common Locations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {results.commonLocations.map((location, index) => (
              <Badge key={index} variant="outline" className="text-sm">
                {location}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fun Fact */}
      <Card className="bg-gradient-to-r from-sandstone/10 to-limestone/10 border-copper/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-copper">
            <Lightbulb className="h-5 w-5" />
            Fascinating Fact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground leading-relaxed italic">{results.funFact}</p>
        </CardContent>
      </Card>

      {/* Low Confidence Warning */}
      {results.confidence < 70 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-800">
                  Identification Uncertainty
                </p>
                <p className="text-xs text-orange-700 mt-1">
                  This identification has lower confidence. For better results, try uploading a clearer image 
                  with good lighting, or provide additional context about where the rock was found.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RockResults;