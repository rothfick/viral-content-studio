import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { STATUS_COLUMNS, ContentStatus, PLATFORMS, Platform } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, RefreshCw, Send, Save, Trash2, Wand2, Mic, Film } from "lucide-react";
import { toast } from "sonner";

type Item = {
  id: string; title: string; idea: string | null; hook: string | null; script: string | null;
  hashtags: string[] | null; voice_url: string | null; video_url: string | null; thumbnail_url: string | null;
  status: ContentStatus; scheduled_at: string | null;
};
type PlatformRow = { id: string; platform: Platform; post_url: string | null; status: string; published_at: string | null };

export default function ContentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState<Item | null>(null);
  const [platforms, setPlatforms] = useState<PlatformRow[]>([]);
  const [hashtagsText, setHashtagsText] = useState("");
  const [saving, setSaving] = useState(false);
  const [webhooks, setWebhooks] = useState<{ regenerate?: string; publish?: string }>({});

  useEffect(() => { document.title = item ? `${item.title} — ViralForge` : "Treść — ViralForge"; }, [item]);

  const load = async () => {
    if (!id) return;
    const { data, error } = await supabase.from("content_items").select("*").eq("id", id).maybeSingle();
    if (error) return toast.error(error.message);
    if (!data) { toast.error("Nie znaleziono treści"); return navigate("/"); }
    setItem(data as Item);
    setHashtagsText((data.hashtags ?? []).join(" "));
    const { data: plats } = await supabase.from("content_platforms").select("*").eq("content_id", id);
    setPlatforms((plats ?? []) as PlatformRow[]);
    const { data: settings } = await supabase.from("user_settings").select("n8n_webhook_regenerate,n8n_webhook_publish").maybeSingle();
    setWebhooks({ regenerate: settings?.n8n_webhook_regenerate ?? undefined, publish: settings?.n8n_webhook_publish ?? undefined });
  };

  useEffect(() => { load(); }, [id]);

  const save = async () => {
    if (!item) return;
    setSaving(true);
    const tags = hashtagsText.split(/\s+/).filter(Boolean).map((t) => (t.startsWith("#") ? t : `#${t}`));
    const { error } = await supabase.from("content_items").update({
      title: item.title, idea: item.idea, hook: item.hook, script: item.script, hashtags: tags,
      status: item.status, scheduled_at: item.scheduled_at,
    }).eq("id", item.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Zapisano");
  };

  const togglePlatform = async (p: Platform) => {
    if (!user || !item) return;
    const existing = platforms.find((x) => x.platform === p);
    if (existing) {
      await supabase.from("content_platforms").delete().eq("id", existing.id);
    } else {
      await supabase.from("content_platforms").insert({ content_id: item.id, user_id: user.id, platform: p, status: "pending" });
    }
    load();
  };

  const triggerWebhook = async (kind: "regenerate" | "publish", payload: Record<string, any> = {}) => {
    const url = webhooks[kind];
    if (!url) {
      toast.error("Skonfiguruj URL webhooka w Ustawieniach");
      return;
    }
    try {
      await fetch(url, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content_id: item?.id, user_id: user?.id, ...payload }),
      });
      toast.success(kind === "publish" ? "Wysłano do publikacji" : "Wysłano do regeneracji");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const remove = async () => {
    if (!item || !confirm("Na pewno usunąć?")) return;
    await supabase.from("content_items").delete().eq("id", item.id);
    navigate("/");
  };

  if (!item) return <div className="p-6 text-muted-foreground">Ładowanie…</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" asChild className="gap-2"><Link to="/"><ArrowLeft className="w-4 h-4" /> Wróć</Link></Button>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={remove}><Trash2 className="w-4 h-4" /></Button>
          <Button onClick={save} disabled={saving} className="gap-2"><Save className="w-4 h-4" /> Zapisz</Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5 space-y-4">
            <div className="space-y-2">
              <Label>Tytuł</Label>
              <Input value={item.title} onChange={(e) => setItem({ ...item, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Pomysł</Label>
              <Textarea value={item.idea ?? ""} onChange={(e) => setItem({ ...item, idea: e.target.value })} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Hook (pierwsze 3 sek.)</Label>
              <Textarea value={item.hook ?? ""} onChange={(e) => setItem({ ...item, hook: e.target.value })} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Skrypt</Label>
              <Textarea value={item.script ?? ""} onChange={(e) => setItem({ ...item, script: e.target.value })} rows={10} />
            </div>
            <div className="space-y-2">
              <Label>Hashtagi (oddzielone spacją)</Label>
              <Input value={hashtagsText} onChange={(e) => setHashtagsText(e.target.value)} placeholder="#fyp #ai #viral" />
            </div>
          </Card>

          <Card className="p-5 space-y-3">
            <div className="font-medium">Generuj przez n8n</div>
            <div className="grid sm:grid-cols-3 gap-2">
              <Button variant="outline" className="gap-2" onClick={() => triggerWebhook("regenerate", { stage: "script" })}>
                <Wand2 className="w-4 h-4" /> Skrypt
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => triggerWebhook("regenerate", { stage: "voice" })}>
                <Mic className="w-4 h-4" /> Głos (TTS)
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => triggerWebhook("regenerate", { stage: "video" })}>
                <Film className="w-4 h-4" /> Wideo
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5 space-y-3">
            <div className="font-medium">Status</div>
            <Select value={item.status} onValueChange={(v) => setItem({ ...item, status: v as ContentStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_COLUMNS.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="space-y-2">
              <Label>Planowana publikacja</Label>
              <Input
                type="datetime-local"
                value={item.scheduled_at ? item.scheduled_at.slice(0, 16) : ""}
                onChange={(e) => setItem({ ...item, scheduled_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
              />
            </div>
          </Card>

          <Card className="p-5 space-y-3">
            <div className="font-medium">Platformy</div>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => {
                const active = platforms.some((x) => x.platform === p.id);
                return (
                  <button key={p.id} onClick={() => togglePlatform(p.id)}
                    className={`px-3 py-1.5 rounded-md text-sm border transition ${
                      active ? `border-${p.color} bg-${p.color}/10 text-foreground` : "border-border text-muted-foreground hover:border-primary/50"
                    }`}>
                    {p.label}
                  </button>
                );
              })}
            </div>
            {platforms.some((p) => p.post_url) && (
              <div className="space-y-1 pt-2 border-t border-border">
                {platforms.filter((p) => p.post_url).map((p) => (
                  <a key={p.id} href={p.post_url!} target="_blank" rel="noreferrer"
                    className="block text-xs text-accent hover:underline truncate">
                    {PLATFORMS.find((x) => x.id === p.platform)?.label}: {p.post_url}
                  </a>
                ))}
              </div>
            )}
            <Button className="w-full gap-2" onClick={() => triggerWebhook("publish", { platforms: platforms.map((p) => p.platform) })}>
              <Send className="w-4 h-4" /> Opublikuj teraz
            </Button>
          </Card>

          <Card className="p-5 space-y-3">
            <div className="font-medium">Podgląd</div>
            <div className="aspect-vertical w-full bg-muted rounded-lg overflow-hidden flex items-center justify-center text-muted-foreground text-xs">
              {item.video_url ? (
                <video src={item.video_url} controls className="w-full h-full object-cover" />
              ) : item.thumbnail_url ? (
                <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />
              ) : (
                "Brak wideo"
              )}
            </div>
            {item.voice_url && <audio src={item.voice_url} controls className="w-full" />}
          </Card>
        </div>
      </div>
    </div>
  );
}
