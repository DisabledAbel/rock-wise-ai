import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();
    console.log('Received image for analysis, length:', image?.length || 0);
    
    if (!image) {
      throw new Error('No image provided');
    }

    console.log('Starting rock identification process with Gemini...');

    // Use Gemini directly for rock identification with image (free tool)
    const rockAnalysis = await analyzeRockWithGemini(image);
    console.log('Gemini rock analysis completed:', rockAnalysis.rockName);

    // Step 4: Combine results into final response
    const result = {
      rockName: rockAnalysis.rockName || 'Unknown Rock',
      type: rockAnalysis.type || 'Unknown',
      composition: rockAnalysis.composition || ['Unable to determine'],
      hardness: rockAnalysis.hardness || 'Unknown',
      formation: rockAnalysis.formation || 'Unable to determine formation process',
      commonLocations: rockAnalysis.commonLocations || ['Unknown'],
      funFact: rockAnalysis.funFact || 'Please try uploading a clearer image for better identification.',
      confidence: rockAnalysis.confidence || 65,
      visualFeatures: rockAnalysis.visualFeatures || []
    };

    console.log('Final identification result:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in identify-rock function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      rockName: 'Unknown Rock',
      type: 'Unknown',
      composition: ['Unable to determine'],
      hardness: 'Unknown',
      formation: 'Unable to determine formation process',
      commonLocations: ['Unknown'],
      funFact: 'Please try uploading a clearer image for better identification.',
      confidence: 0,
      visualFeatures: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});


async function analyzeRockWithGemini(base64Image: string) {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  console.log('Gemini API key exists:', !!apiKey);
  
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  // Remove data URL prefix if present
  const imageData = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
  console.log('Processing image data, length:', imageData.length);

  try {
    const prompt = `Analyze this rock image and provide a geological identification. Return a JSON object with:
- rockName: specific rock or mineral name
- type: "Igneous", "Sedimentary", "Metamorphic", or "Mineral" 
- composition: array of main minerals/components
- hardness: Mohs scale rating (e.g., "6-7")
- formation: brief formation process description
- commonLocations: array of where this rock is typically found
- funFact: interesting geological fact
- confidence: confidence percentage (0-100)
- visualFeatures: array of visible features you can identify

Be as specific as possible based on visible textures, colors, crystal structure, and geological characteristics.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: imageData
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 1000,
        }
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} - ${JSON.stringify(data)}`);
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (text) {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.error('Failed to parse Gemini JSON:', parseError);
        }
      }
    }
    
    // Fallback response
    return {
      rockName: 'Unidentified Rock Specimen',
      type: 'Unknown',
      composition: ['Unable to determine from image'],
      hardness: 'Unknown',
      formation: 'Formation process could not be determined',
      commonLocations: ['Various locations'],
      funFact: 'Geological specimen requiring further analysis.',
      confidence: 50,
      visualFeatures: ['Rock specimen visible']
    };
    
  } catch (error) {
    console.error('Gemini analysis error:', error);
    throw error;
  }
}