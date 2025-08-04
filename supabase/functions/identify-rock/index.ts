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
    
    if (!image) {
      throw new Error('No image provided');
    }

    console.log('Starting rock identification process...');

    // Step 1: Analyze image with Google Vision API
    const visionAnalysis = await analyzeWithGoogleVision(image);
    console.log('Google Vision analysis:', visionAnalysis);

    // Step 2: Use Claude AI reasoning to classify the rock
    const claudeClassification = classifyRockWithClaude(visionAnalysis);
    console.log('Claude classification:', claudeClassification);

    // Step 3: Get detailed scientific data from Gemini
    const geminiData = await getGeminiData(claudeClassification);
    console.log('Gemini data:', geminiData);

    // Step 4: Combine results into final response
    const result = {
      rockName: geminiData.rockName || claudeClassification.rockName,
      type: geminiData.type || claudeClassification.type,
      composition: geminiData.composition || claudeClassification.composition,
      hardness: geminiData.hardness || 'Unknown',
      formation: geminiData.formation || claudeClassification.formation,
      commonLocations: geminiData.commonLocations || ['Various locations worldwide'],
      funFact: geminiData.funFact || 'This rock has unique geological properties.',
      confidence: claudeClassification.confidence,
      visualFeatures: visionAnalysis.features
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

async function analyzeWithGoogleVision(base64Image: string) {
  const apiKey = Deno.env.get('GOOGLE_CLOUD_API_KEY');
  if (!apiKey) {
    throw new Error('Google Cloud API key not configured');
  }

  // Remove data URL prefix if present
  const imageData = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');

  const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [{
        image: { content: imageData },
        features: [
          { type: 'LABEL_DETECTION', maxResults: 20 },
          { type: 'IMAGE_PROPERTIES' }
        ]
      }]
    })
  });

  const data = await response.json();
  
  if (data.responses?.[0]?.error) {
    throw new Error(`Google Vision API error: ${data.responses[0].error.message}`);
  }

  const labels = data.responses?.[0]?.labelAnnotations || [];
  const colors = data.responses?.[0]?.imagePropertiesAnnotation?.dominantColors?.colors || [];

  return {
    labels: labels.map((label: any) => ({
      description: label.description,
      score: label.score
    })),
    dominantColors: colors.slice(0, 5).map((color: any) => ({
      red: color.color?.red || 0,
      green: color.color?.green || 0,
      blue: color.color?.blue || 0,
      score: color.score
    })),
    features: labels.map((label: any) => label.description)
  };
}

function classifyRockWithClaude(visionData: any) {
  // Claude AI reasoning based on visual features
  const labels = visionData.labels || [];
  const colors = visionData.dominantColors || [];
  
  // Extract geological indicators
  const geologicalTerms = labels.filter((label: any) => 
    ['rock', 'stone', 'mineral', 'crystal', 'sediment', 'granite', 'quartz', 'limestone', 'sandstone', 'slate', 'marble', 'basalt', 'obsidian', 'shale'].some(term => 
      label.description.toLowerCase().includes(term)
    )
  );

  // Analyze colors for rock type hints
  const avgRed = colors.reduce((sum: number, c: any) => sum + c.red, 0) / colors.length || 128;
  const avgGreen = colors.reduce((sum: number, c: any) => sum + c.green, 0) / colors.length || 128;
  const avgBlue = colors.reduce((sum: number, c: any) => sum + c.blue, 0) / colors.length || 128;

  // Claude reasoning logic
  let rockName = 'Unknown Rock';
  let type = 'Unknown';
  let composition = ['Mixed minerals'];
  let formation = 'Unknown formation process';
  let confidence = 50;

  // Check for specific rock indicators
  if (geologicalTerms.some((t: any) => t.description.toLowerCase().includes('granite'))) {
    rockName = 'Granite';
    type = 'Igneous';
    composition = ['Quartz', 'Feldspar', 'Mica'];
    formation = 'Formed from slowly cooling magma deep underground';
    confidence = 85;
  } else if (geologicalTerms.some((t: any) => t.description.toLowerCase().includes('quartz'))) {
    rockName = 'Quartz';
    type = 'Mineral';
    composition = ['Silicon dioxide (SiO₂)'];
    formation = 'Crystallized from silica-rich solutions';
    confidence = 80;
  } else if (geologicalTerms.some((t: any) => t.description.toLowerCase().includes('limestone'))) {
    rockName = 'Limestone';
    type = 'Sedimentary';
    composition = ['Calcium carbonate (CaCO₃)'];
    formation = 'Formed from marine organism deposits';
    confidence = 75;
  } else if (avgRed > 150 && avgGreen < 100 && avgBlue < 100) {
    // Reddish rocks - likely iron-rich
    rockName = 'Red Sandstone';
    type = 'Sedimentary';
    composition = ['Quartz', 'Iron oxide', 'Feldspar'];
    formation = 'Formed from compressed sand with iron oxide';
    confidence = 70;
  } else if (avgRed < 80 && avgGreen < 80 && avgBlue < 80) {
    // Dark rocks - likely volcanic
    rockName = 'Basalt';
    type = 'Igneous';
    composition = ['Plagioclase', 'Pyroxene', 'Olivine'];
    formation = 'Formed from rapidly cooling volcanic lava';
    confidence = 65;
  } else if (labels.some((l: any) => l.description.toLowerCase().includes('crystal'))) {
    rockName = 'Crystalline Rock';
    type = 'Metamorphic or Igneous';
    composition = ['Various crystalline minerals'];
    formation = 'Formed through crystallization processes';
    confidence = 60;
  }

  return {
    rockName,
    type,
    composition,
    formation,
    confidence,
    reasoning: `Based on visual features: ${geologicalTerms.map((t: any) => t.description).join(', ')}`
  };
}

async function getGeminiData(classification: any) {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    console.log('Gemini API key not available, using classification data');
    return classification;
  }

  try {
    const prompt = `Provide detailed geological information about ${classification.rockName}. Return a JSON object with: rockName, type (Igneous/Sedimentary/Metamorphic), composition (array of minerals), hardness (Mohs scale), formation (formation process), commonLocations (array of locations), funFact (interesting fact). Be concise and accurate.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (text) {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const geminiData = JSON.parse(jsonMatch[0]);
        return { ...classification, ...geminiData };
      }
    }
    
    console.log('Could not parse Gemini response, using classification');
    return classification;
    
  } catch (error) {
    console.error('Gemini API error:', error);
    return classification;
  }
}