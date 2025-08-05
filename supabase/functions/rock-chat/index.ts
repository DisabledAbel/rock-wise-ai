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
    const { message } = await req.json();

    if (!message) {
      throw new Error('No message provided');
    }

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    console.log('Processing chat message:', message);
    console.log('API key exists:', !!ANTHROPIC_API_KEY);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        system: `You are Rock Wise AI, a knowledgeable geological assistant specializing in rock and mineral identification, geological processes, and earth sciences. You provide accurate, educational, and engaging information about:

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

If asked about topics outside geology, politely redirect the conversation back to rocks, minerals, and earth sciences.`,
        messages: [
          {
            role: 'user',
            content: message
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Anthropic API error:', errorData);
      throw new Error(`Anthropic API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const chatResponse = data.content[0].text;

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