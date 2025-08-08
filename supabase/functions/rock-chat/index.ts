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
    const { message, context } = await req.json();
    console.log('Received request body:', { hasMessage: !!message, hasContext: !!context });

    if (!message) {
      console.log('No message provided');
      throw new Error('No message provided');
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    console.log('GEMINI_API_KEY exists:', !!GEMINI_API_KEY);
    console.log('GEMINI_API_KEY length:', GEMINI_API_KEY?.length || 0);
    
    if (!GEMINI_API_KEY) {
      console.log('GEMINI_API_KEY not configured');
      throw new Error('GEMINI_API_KEY not configured');
    }

    console.log('Processing chat message:', message);

    // Build prompt parts with optional page context and image
    const parts: any[] = [];

    let systemText = `You are Rock Wise AI, a knowledgeable geological assistant specializing in rock and mineral identification, geological processes, and earth sciences. You provide accurate, educational, and engaging information about:

- Rock types (igneous, sedimentary, metamorphic)
- Mineral identification and properties
- Geological formations and processes
- Earth history and geological time
- Mining and mineral extraction
- Crystallography and gemology
- Geological tools and field work
- Rock collecting and specimen preparation

Keep your responses:
- Scientifically accurate and educational
- Accessible to both beginners and enthusiasts
- Engaging with interesting facts when appropriate
- Focused on geology and earth sciences
- Professional but friendly in tone

If asked about topics outside geology, politely redirect the conversation back to rocks, minerals, and earth sciences.`;

    if (context?.results) {
      try {
        const contextJson = JSON.stringify(context.results);
        systemText += `\n\nCurrent page context: The user is viewing an analyzed rock specimen. Use the provided analysis JSON as primary context and be specific to the specimen shown.\nAnalysis JSON:\n${contextJson}`;
      } catch (_) {
        // ignore
      }
    }

    parts.push({ text: systemText });

    if (context?.imageBase64) {
      try {
        const raw = String(context.imageBase64);
        const match = raw.match(/^data:(.*?);base64,(.*)$/);
        const mimeType = match?.[1] || 'image/jpeg';
        const dataB64 = match?.[2] || raw;
        parts.push({ inlineData: { mimeType, data: dataB64 } });
      } catch (e) {
        console.log('Failed to attach image context:', e);
      }
    }

    parts.push({ text: `User question: ${message}` });

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          { parts }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 500,
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      throw new Error(`Gemini API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const chatResponse = data.candidates[0].content.parts[0].text;

    console.log('Chat response generated successfully');

    return new Response(
      JSON.stringify({ response: chatResponse }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in rock-chat function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        response: "I apologize, but I'm having trouble processing your message right now. Please try again in a moment."
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});