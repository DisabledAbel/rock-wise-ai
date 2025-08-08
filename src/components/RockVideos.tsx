import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Video {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  url: string;
  publishedAt?: string;
}

interface RockVideosProps {
  rockName: string;
}

const RockVideos: React.FC<RockVideosProps> = ({ rockName }) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let ignore = false;
    async function fetchVideos() {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('youtube-rock-videos', {
          body: { query: `${rockName} geology rock identification`, maxResults: 6 },
        });
        if (error) throw error;
        if (!ignore) setVideos(data?.videos || []);
      } catch (e) {
        console.error('Failed to load videos', e);
        if (!ignore) setVideos([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchVideos();
    return () => { ignore = true; };
  }, [rockName]);

  if (loading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Related videos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="w-full aspect-video rounded" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!videos.length) return null;

  return (
    <section aria-labelledby="videos-heading" className="mt-6">
      <Card>
        <CardHeader>
          <CardTitle id="videos-heading">Learn more about {rockName}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((v) => (
              <a
                key={v.videoId}
                href={v.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-lg overflow-hidden border border-border hover:border-copper transition-colors"
              >
                <div className="aspect-video bg-muted">
                  <img
                    src={v.thumbnail}
                    alt={`${rockName} geology video: ${v.title}`}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3 space-y-1">
                  <h4 className="text-sm font-semibold line-clamp-2">{v.title}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-1 flex items-center gap-1">
                    {v.channelTitle} <ExternalLink className="h-3 w-3" />
                  </p>
                </div>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default RockVideos;
