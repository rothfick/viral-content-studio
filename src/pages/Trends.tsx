import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Sparkles, Plus } from "lucide-react";
import { toast } from "sonner";
import { PLATFORMS } from "@/lib/constants";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";

type Topic = { id: string; topic: string; description: string | null; platform: string | null; score: number | null; source: string | null; discovered_at: string; used: boolean };

export default function Trends() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [topics, setTopics] = useState<Topic[]>([]);

  useEffect(() => { document.title = "Trendy — ViralForge"; }, []);

  const load = async () => {
    const { data } = await supabase.from("trending_topics")
      .select("*").order("score", { ascending: false, nullsFirst: false }).order("discovered_at", { ascending: false }).limit(50);
    setTopics((data ?? []) as Topic[]);
  };

  useEffect(() => { load(); }, []);

  const useTopic = async (t: Topic) => {
    if (!user) return;
    const { data, error } = await supabase.from("content_items").insert({
      user_id: user.id, title: t.topic, idea: t.description ?? t.topic, status: "idea",
    }).select("id").single();
    if (error) return toast.error(error.message);
    await supabase.from("trending_topics").update({ used: true }).eq("id", t.id);
    toast.success("Utworzono draft");
    navigate(`/content/${data.id}`);
  };

  return (
    <div className="p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><TrendingUp className="w-6 h-6 text-accent" /> Trendy & pomysły</h1>
        <p className="text-sm text-muted-foreground">Dane z workflow n8n researchu trendów</p>
      </header>

      {topics.length === 0 ? (
        <Card className="p-8 text-center">
          <Sparkles className="w-10 h-10 mx-auto text-primary mb-3" />
          <div className="font-medium mb-1">Brak trendów</div>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Skonfiguruj workflow n8n, żeby cyklicznie zapisywało trendujące tematy do tabeli <code>trending_topics</code>.
          </p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {topics.map((t) => {
            const platform = PLATFORMS.find((p) => p.id === t.platform);
            return (
              <Card key={t.id} className={`p-5 ${t.used ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="font-semibold">{t.topic}</div>
                  {t.score && <Badge variant="secondary">{Number(t.score).toFixed(0)}</Badge>}
                </div>
                {t.description && <p className="text-sm text-muted-foreground mb-3">{t.description}</p>}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {platform && <Badge variant="outline" className={`text-${platform.color}`}>{platform.label}</Badge>}
                    {t.source && <span>{t.source}</span>}
                    <span>{formatDistanceToNow(new Date(t.discovered_at), { locale: pl, addSuffix: true })}</span>
                  </div>
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => useTopic(t)} disabled={t.used}>
                    <Plus className="w-3 h-3" /> {t.used ? "Użyte" : "Użyj"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
