import React, { useState, useCallback } from 'react';
import { Upload, Camera, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RockUploaderProps {
  onImageUpload: (file: File) => void;
  isAnalyzing: boolean;
}

const RockUploader: React.FC<RockUploaderProps> = ({ onImageUpload, isAnalyzing }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleFileSelection(imageFile);
    }
  }, []);

  const handleFileSelection = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    onImageUpload(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-8">
        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200",
            isDragOver 
              ? "border-copper bg-sandstone/20 scale-105" 
              : "border-border hover:border-granite",
            isAnalyzing && "pointer-events-none opacity-60"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {preview ? (
            <div className="space-y-4">
              <img
                src={preview}
                alt="Rock preview"
                className="max-w-full max-h-64 mx-auto rounded-lg shadow-lg"
              />
              <p className="text-sm text-muted-foreground">
                {isAnalyzing ? "Analyzing your rock specimen..." : "Click 'Analyze Rock' to identify"}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="p-4 bg-limestone/50 rounded-full">
                  <Upload className="h-12 w-12 text-granite" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-foreground">
                  Upload Rock Image
                </h3>
                <p className="text-muted-foreground">
                  Drag and drop an image of your rock specimen, or click to browse
                </p>
              </div>

              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('file-input')?.click()}
                  disabled={isAnalyzing}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Browse Files
                </Button>
              </div>

              <input
                id="file-input"
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-copper" />
            <span>High resolution images work best</span>
          </div>
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-slate" />
            <span>JPG, PNG, WEBP supported</span>
          </div>
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-iron" />
            <span>Max file size: 10MB</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RockUploader;