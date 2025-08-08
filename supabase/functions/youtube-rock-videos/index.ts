import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const YT_KEY = Deno.env.get('YOUTUBE_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!YT_KEY) throw new Error('Missing YOUTUBE_API_KEY secret');

    const { query, maxResults = 6 } = await req.json();

    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid or missing "query"' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('q', query);
    url.searchParams.set('maxResults', String(Math.min(10, Math.max(1, maxResults))));
    url.searchParams.set('type', 'video');
    url.searchParams.set('safeSearch', 'moderate');
    url.searchParams.set('videoEmbeddable', 'true');
    url.searchParams.set('key', YT_KEY);

    const ytRes = await fetch(url.toString());
    const ytData = await ytRes.json();

    if (!ytRes.ok) {
      console.error('YouTube API error:', ytData);
      return new Response(JSON.stringify({ error: 'YouTube API error', details: ytData }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const videos = (ytData.items || []).map((item: any) => ({
      videoId: item.id?.videoId,
      title: item.snippet?.title,
      description: item.snippet?.description,
      channelTitle: item.snippet?.channelTitle,
      publishedAt: item.snippet?.publishedAt,
      thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url,
      url: item.id?.videoId ? `https://www.youtube.com/watch?v=${item.id.videoId}` : null,
    })).filter((v: any) => v.videoId && v.url);

    return new Response(JSON.stringify({ videos }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    console.error('youtube-rock-videos error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
