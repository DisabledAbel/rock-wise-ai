import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { 
  Mountain, 
  Microscope, 
  Brain, 
  Sparkles,
  ArrowRight,
  Search
} from 'lucide-react';
import RockUploader from '@/components/RockUploader';
import RockResults, { RockIdentification } from '@/components/RockResults';
import { supabase } from '@/integrations/supabase/client';
import heroImage from '@/assets/rock-hero.jpg';

const Index = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<RockIdentification | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const handleImageUpload = async (file: File) => {
    setUploadedImage(URL.createObjectURL(file));
    setResults(null);
  };

  const analyzeRock = async () => {
    if (!uploadedImage) {
      toast({
        title: "No Image Selected",
        description: "Please upload an image of your rock specimen first.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Convert uploaded image to base64
      const response = await fetch(uploadedImage);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      const { data, error } = await supabase.functions.invoke('identify-rock', {
        body: { image: base64 }
      });

      if (error) throw error;

      setResults(data);
      toast({
        title: "Analysis Complete",
        description: `Identified as ${data.rockName} with ${data.confidence}% confidence`,
      });
    } catch (error) {
      console.error('Error analyzing rock:', error);
      toast({
        title: "Analysis Failed",
        description: "There was an error analyzing your rock. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setResults(null);
    setUploadedImage(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 to-background/60" />
        
        <div className="relative max-w-4xl mx-auto space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Mountain className="h-12 w-12 text-copper" />
              <h1 className="text-5xl font-bold bg-gradient-to-r from-granite to-slate bg-clip-text text-transparent">
                Rock Wise AI
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Advanced geological identification using Google Vision AI, Claude reasoning, and Gemini scientific data. 
              Discover the secrets hidden in your rock specimens.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <Card className="border-copper/20 bg-limestone/20 backdrop-blur-sm">
              <CardContent className="pt-6 text-center">
                <Microscope className="h-8 w-8 text-copper mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Advanced Vision</h3>
                <p className="text-sm text-muted-foreground">
                  Google Vision AI analyzes textures, colors, and mineral patterns
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate/20 bg-quartz/20 backdrop-blur-sm">
              <CardContent className="pt-6 text-center">
                <Brain className="h-8 w-8 text-slate mx-auto mb-3" />
                <h3 className="font-semibold mb-2">AI Reasoning</h3>
                <p className="text-sm text-muted-foreground">
                  Claude AI provides intelligent geological classification
                </p>
              </CardContent>
            </Card>

            <Card className="border-iron/20 bg-sandstone/20 backdrop-blur-sm">
              <CardContent className="pt-6 text-center">
                <Sparkles className="h-8 w-8 text-iron mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Scientific Data</h3>
                <p className="text-sm text-muted-foreground">
                  Gemini API provides comprehensive geological information
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Separator className="my-8" />

      {/* Main Analysis Section */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          {!results ? (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold text-foreground">
                  Identify Your Rock Specimen
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Upload a clear image of your rock, and our AI will provide detailed geological analysis 
                  including type, composition, formation process, and fascinating facts.
                </p>
              </div>

              <RockUploader 
                onImageUpload={handleImageUpload}
                isAnalyzing={isAnalyzing}
              />

              {uploadedImage && (
                <div className="text-center">
                  <Button 
                    onClick={analyzeRock}
                    disabled={isAnalyzing}
                    size="lg"
                    className="bg-copper hover:bg-copper/90 text-white font-semibold px-8"
                  >
                    {isAnalyzing ? (
                      <>
                        <Microscope className="h-5 w-5 mr-2 animate-spin" />
                        Analyzing Rock...
                      </>
                    ) : (
                      <>
                        <Search className="h-5 w-5 mr-2" />
                        Analyze Rock
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-foreground">
                  Analysis Results
                </h2>
                <Button 
                  onClick={resetAnalysis}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <ArrowRight className="h-4 w-4 rotate-180" />
                  Analyze Another Rock
                </Button>
              </div>

              <RockResults 
                results={results}
                analysisImage={uploadedImage || undefined}
              />
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-8 px-4 mt-16">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Mountain className="h-6 w-6 text-copper" />
            <span className="font-semibold text-foreground">Rock Wise AI</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Powered by Google Vision AI, Claude AI, and Gemini API for accurate geological identification
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;