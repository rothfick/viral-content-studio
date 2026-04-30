import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { Eye, Heart, MessageCircle, Share2 } from "lucide-react";
import { format, parseISO, subDays } from "date-fns";
import { PLATFORMS, Platform } from "@/lib/constants";

type Row = { content_id: string; platform: Platform; views: number; likes: number; comments: number; shares: number; fetched_at: string };

export default function Analytics() {
  const [rows, setRows] = useState<Row[]>([]);
  const [topContent, setTopContent] = useState<{ id: string; title: string; views: number }[]>([]);

  useEffect(() => { document.title = "Statystyki — ViralForge"; }, []);

  useEffect(() => {
    (async () => {
      const since = subDays(new Date(), 30).toISOString();
      const { data } = await supabase
        .from("analytics")
        .select("content_id,platform,views,likes,comments,shares,fetched_at")
        .gte("fetched_at", since)
        .order("fetched_at", { ascending: true });
      setRows((data ?? []) as Row[]);

      // top content (latest snapshot per content)
      const latest = new Map<string, number>();
      (data ?? []).forEach((r: any) => {
        latest.set(r.content_id, (latest.get(r.content_id) ?? 0) + r.views);
      });
      const ids = Array.from(latest.keys()).slice(0, 50);
      if (ids.length) {
        const { data: titles } = await supabase.from("content_items").select("id,title").in("id", ids);
        const titleMap = new Map((titles ?? []).map((t) => [t.id, t.title]));
        setTopContent(
          Array.from(latest.entries())
            .map(([id, views]) => ({ id, title: titleMap.get(id) ?? "—", views }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 5)
        );
      }
    })();
  }, []);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => ({ views: acc.views + r.views, likes: acc.likes + r.likes, comments: acc.comments + r.comments, shares: acc.shares + r.shares }),
      { views: 0, likes: 0, comments: 0, shares: 0 }
    );
  }, [rows]);

  const timeSeries = useMemo(() => {
    const by = new Map<string, { date: string; views: number }>();
    rows.forEach((r) => {
      const k = format(parseISO(r.fetched_at), "dd MMM");
      by.set(k, { date: k, views: (by.get(k)?.views ?? 0) + r.views });
    });
    return Array.from(by.values());
  }, [rows]);

  const platformData = useMemo(() => {
    return PLATFORMS.map((p) => {
      const r = rows.filter((x) => x.platform === p.id);
      return {
        name: p.label,
        views: r.reduce((a, x) => a + x.views, 0),
        likes: r.reduce((a, x) => a + x.likes, 0),
      };
    });
  }, [rows]);

  const stats = [
    { label: "Wyświetlenia", value: totals.views, icon: Eye },
    { label: "Polubienia", value: totals.likes, icon: Heart },
    { label: "Komentarze", value: totals.comments, icon: MessageCircle },
    { label: "Udostępnienia", value: totals.shares, icon: Share2 },
  ];

  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toString();

  return (
    <div className="p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Statystyki</h1>
        <p className="text-sm text-muted-foreground">Ostatnie 30 dni</p>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="text-2xl font-bold mt-1">{fmt(value)}</div>
              </div>
              <Icon className="w-5 h-5 text-primary" />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <Card className="p-5">
          <div className="font-medium mb-4">Wyświetlenia w czasie</div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={timeSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Line type="monotone" dataKey="views" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <div className="font-medium mb-4">Per platforma</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={platformData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Legend />
              <Bar dataKey="views" fill="hsl(var(--primary))" />
              <Bar dataKey="likes" fill="hsl(var(--accent))" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-5">
        <div className="font-medium mb-4">Top performing</div>
        {topContent.length === 0 ? (
          <div className="text-sm text-muted-foreground">Brak danych. n8n powinno cyklicznie pobierać statystyki i wpisywać je do bazy (tabela <code>analytics</code>).</div>
        ) : (
          <div className="space-y-2">
            {topContent.map((c, i) => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-md bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">{i + 1}</div>
                  <div className="text-sm">{c.title}</div>
                </div>
                <div className="text-sm font-medium">{fmt(c.views)} views</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
