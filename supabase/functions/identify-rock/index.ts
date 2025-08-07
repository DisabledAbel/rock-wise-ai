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

    console.log('Starting multi-AI rock identification process...');

    // Run multiple AI analyses in parallel for comprehensive results
    const [geminiResult, openaiResult, anthropicResult] = await Promise.allSettled([
      analyzeRockWithGemini(image),
      analyzeRockWithOpenAI(image),
      analyzeRockWithAnthropic(image)
    ]);

    console.log('AI analysis results:', { 
      gemini: geminiResult.status, 
      openai: openaiResult.status,
      anthropic: anthropicResult.status 
    });

    // Combine results from multiple AIs
    const combinedAnalysis = combineMultipleAnalyses(geminiResult, openaiResult, anthropicResult);
    console.log('Combined analysis completed:', combinedAnalysis.rockName);

    // Use combined analysis result
    const result = {
      rockName: combinedAnalysis.rockName || 'Unknown Rock',
      type: combinedAnalysis.type || 'Unknown',
      composition: combinedAnalysis.composition || ['Unable to determine'],
      hardness: combinedAnalysis.hardness || 'Unknown',
      formation: combinedAnalysis.formation || 'Unable to determine formation process',
      commonLocations: combinedAnalysis.commonLocations || ['Unknown'],
      funFact: combinedAnalysis.funFact || 'Please try uploading a clearer image for better identification.',
      confidence: combinedAnalysis.confidence || 65,
      visualFeatures: combinedAnalysis.visualFeatures || [],
      analysisSource: combinedAnalysis.analysisSource || 'Multi-AI Analysis'
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

async function analyzeRockWithOpenAI(base64Image: string) {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  console.log('OpenAI API key exists:', !!apiKey);
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const imageData = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: 'You are a geology expert specializing in rock and mineral identification. Analyze images with scientific precision.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this rock specimen and provide geological identification. Return only a JSON object with:
- rockName: specific rock or mineral name
- type: "Igneous", "Sedimentary", "Metamorphic", or "Mineral"
- composition: array of main minerals/components  
- hardness: Mohs scale rating (e.g., "6-7")
- formation: brief formation process description
- commonLocations: array of where this rock is typically found
- funFact: interesting geological fact
- confidence: confidence percentage (0-100)
- visualFeatures: array of visible features you can identify

Focus on visible textures, colors, crystal structure, and geological characteristics.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageData}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} - ${JSON.stringify(data)}`);
    }

    const text = data.choices?.[0]?.message?.content;
    
    if (text) {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.error('Failed to parse OpenAI JSON:', parseError);
        }
      }
    }
    
    return {
      rockName: 'OpenAI Analysis Unavailable',
      type: 'Unknown',
      composition: ['Unable to determine'],
      hardness: 'Unknown',
      formation: 'Analysis incomplete',
      commonLocations: ['Various locations'],
      funFact: 'OpenAI analysis could not be completed.',
      confidence: 25,
      visualFeatures: ['Image processed']
    };
    
  } catch (error) {
    console.error('OpenAI analysis error:', error);
    throw error;
  }
}

async function analyzeRockWithAnthropic(base64Image: string) {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  console.log('Anthropic API key exists:', !!apiKey);
  
  if (!apiKey) {
    throw new Error('Anthropic API key not configured');
  }

  const imageData = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `As a geological expert, analyze this rock specimen image and provide scientific identification. Return only a JSON object with:
- rockName: specific rock or mineral name
- type: "Igneous", "Sedimentary", "Metamorphic", or "Mineral"
- composition: array of main minerals/components
- hardness: Mohs scale rating (e.g., "6-7")
- formation: brief formation process description
- commonLocations: array of where this rock is typically found
- funFact: interesting geological fact
- confidence: confidence percentage (0-100)
- visualFeatures: array of visible features you can identify

Focus on visible textures, grain size, color, luster, crystal habits, and other diagnostic features.`
              },
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: imageData
                }
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status} - ${JSON.stringify(data)}`);
    }

    const text = data.content?.[0]?.text;
    
    if (text) {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.error('Failed to parse Anthropic JSON:', parseError);
        }
      }
    }
    
    return {
      rockName: 'Anthropic Analysis Unavailable',
      type: 'Unknown',
      composition: ['Unable to determine'],
      hardness: 'Unknown',
      formation: 'Analysis incomplete',
      commonLocations: ['Various locations'],
      funFact: 'Anthropic analysis could not be completed.',
      confidence: 25,
      visualFeatures: ['Image processed']
    };
    
  } catch (error) {
    console.error('Anthropic analysis error:', error);
    throw error;
  }
}

function combineMultipleAnalyses(geminiResult: any, openaiResult: any, anthropicResult: any) {
  console.log('Combining analyses from multiple AI sources...');
  
  const analyses = [];
  
  // Extract successful results
  if (geminiResult.status === 'fulfilled' && geminiResult.value) {
    analyses.push({ ...geminiResult.value, source: 'Gemini' });
  }
  if (openaiResult.status === 'fulfilled' && openaiResult.value) {
    analyses.push({ ...openaiResult.value, source: 'OpenAI' });
  }
  if (anthropicResult.status === 'fulfilled' && anthropicResult.value) {
    analyses.push({ ...anthropicResult.value, source: 'Anthropic' });
  }

  console.log(`Successfully combined ${analyses.length} AI analyses`);

  if (analyses.length === 0) {
    return {
      rockName: 'Analysis Failed',
      type: 'Unknown',
      composition: ['Unable to determine'],
      hardness: 'Unknown',
      formation: 'All AI analyses failed',
      commonLocations: ['Unknown'],
      funFact: 'Please try uploading a clearer image.',
      confidence: 0,
      visualFeatures: [],
      analysisSource: 'No successful analysis'
    };
  }

  // Use the analysis with highest confidence, or combine if similar confidence
  const sortedByConfidence = analyses.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
  const bestAnalysis = sortedByConfidence[0];
  
  // Combine visual features from all analyses
  const allVisualFeatures = analyses.flatMap(a => a.visualFeatures || []);
  const uniqueVisualFeatures = [...new Set(allVisualFeatures)];
  
  // Combine composition from all analyses
  const allComposition = analyses.flatMap(a => a.composition || []);
  const uniqueComposition = [...new Set(allComposition)];
  
  // Calculate average confidence
  const avgConfidence = Math.round(
    analyses.reduce((sum, a) => sum + (a.confidence || 0), 0) / analyses.length
  );

  // Check for consensus on rock name
  const rockNames = analyses.map(a => a.rockName).filter(Boolean);
  const consensusRock = findConsensus(rockNames) || bestAnalysis.rockName;
  
  // Check for consensus on type
  const types = analyses.map(a => a.type).filter(Boolean);
  const consensusType = findConsensus(types) || bestAnalysis.type;

  return {
    rockName: consensusRock,
    type: consensusType,
    composition: uniqueComposition.slice(0, 5), // Limit to top 5
    hardness: bestAnalysis.hardness,
    formation: bestAnalysis.formation,
    commonLocations: bestAnalysis.commonLocations,
    funFact: bestAnalysis.funFact,
    confidence: Math.min(avgConfidence + 10, 95), // Boost confidence for multi-AI analysis
    visualFeatures: uniqueVisualFeatures.slice(0, 8), // Limit to top 8
    analysisSource: `Multi-AI Analysis (${analyses.map(a => a.source).join(', ')})`
  };
}

function findConsensus(items: string[]): string | null {
  const counts = items.reduce((acc, item) => {
    const normalized = item.toLowerCase();
    acc[normalized] = (acc[normalized] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const maxCount = Math.max(...Object.values(counts));
  if (maxCount > 1) {
    const consensusKey = Object.keys(counts).find(key => counts[key] === maxCount);
    return items.find(item => item.toLowerCase() === consensusKey) || null;
  }
  
  return null;