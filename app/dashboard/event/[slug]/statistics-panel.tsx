"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Download, Users, TrendingUp, BarChart3 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { EventStatistics } from "@/lib/supabase/statistics";

interface StatisticsPanelProps {
  eventId: string;
  initialStats: EventStatistics;
  labels: {
    title: string;
    description: string;
    totalPhotos: string;
    todayPhotos: string;
    onlineViewers: string;
    totalDownloads: string;
  };
}

export function StatisticsPanel({ eventId, initialStats, labels }: StatisticsPanelProps) {
  const [stats, setStats] = useState(initialStats);
  const supabase = createClient();

  const fetchStats = useCallback(async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayIso = today.toISOString();
      
      const [totalPhotosResult, todayPhotosResult, downloadsResult] = await Promise.all([
        supabase
          .from("photos")
          .select("*", { count: "exact", head: true })
          .eq("event_id", eventId),
        
        supabase
          .from("photos")
          .select("*", { count: "exact", head: true })
          .eq("event_id", eventId)
          .gte("created_at", todayIso),
        
        supabase
          .from("photos")
          .select("download_count")
          .eq("event_id", eventId),
      ]);

      const totalPhotos = totalPhotosResult.count || 0;
      const todayPhotos = todayPhotosResult.count || 0;
      const totalDownloads = (downloadsResult.data || []).reduce((sum, photo) => sum + (photo.download_count || 0), 0);

      setStats(prev => ({
        ...prev,
        totalPhotos,
        todayPhotos,
        totalDownloads,
      }));
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, [eventId, supabase]);

  useEffect(() => {
    const channel = supabase
      .channel(`event_stats_${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "photos",
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          fetchStats();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "photos",
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    const interval = setInterval(fetchStats, 30000);

    return () => {
      channel.unsubscribe();
      clearInterval(interval);
    };
  }, [eventId, supabase, fetchStats]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {labels.title}
        </CardTitle>
        <CardDescription>{labels.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2 p-4 bg-secondary rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Camera className="h-4 w-4" />
              <span className="text-sm">{labels.totalPhotos}</span>
            </div>
            <p className="text-3xl font-bold">{stats.totalPhotos}</p>
          </div>

          <div className="space-y-2 p-4 bg-secondary rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">{labels.todayPhotos}</span>
            </div>
            <p className="text-3xl font-bold">{stats.todayPhotos}</p>
          </div>

          <div className="space-y-2 p-4 bg-secondary rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="text-sm">{labels.onlineViewers}</span>
            </div>
            <p className="text-3xl font-bold">{stats.onlineViewers}</p>
          </div>

          <div className="space-y-2 p-4 bg-secondary rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Download className="h-4 w-4" />
              <span className="text-sm">{labels.totalDownloads}</span>
            </div>
            <p className="text-3xl font-bold">{stats.totalDownloads}</p>
          </div>
        </div>

        {/* <div className="space-y-3">
          <h4 className="font-medium">{t("uploadDistribution")}</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="hour" 
                  tick={{ fontSize: 10 }}
                  interval={3}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Bar 
                  dataKey="count" 
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div> */}
      </CardContent>
    </Card>
  );
}
