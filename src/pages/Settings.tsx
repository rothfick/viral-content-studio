import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Webhook, Code2 } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const [s, setS] = useState({
    n8n_webhook_create: "", n8n_webhook_regenerate: "", n8n_webhook_publish: "",
    brand_voice: "", default_voice_id: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { document.title = "Ustawienia — ViralForge"; }, []);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle();
      if (data) {
        setS({
          n8n_webhook_create: data.n8n_webhook_create ?? "",
          n8n_webhook_regenerate: data.n8n_webhook_regenerate ?? "",
          n8n_webhook_publish: data.n8n_webhook_publish ?? "",
          brand_voice: data.brand_voice ?? "",
          default_voice_id: data.default_voice_id ?? "",
        });
      }
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("user_settings").upsert({ user_id: user.id, ...s });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Zapisano ustawienia");
  };

  return (
    <div className="p-6 max-w-3xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Ustawienia</h1>
        <p className="text-sm text-muted-foreground">Konfiguracja webhooków n8n i głosu marki</p>
      </header>

      <Card className="p-5 mb-4 space-y-4">
        <div className="flex items-center gap-2 font-medium"><Webhook className="w-4 h-4" /> Webhooks n8n</div>
        <div className="space-y-2">
          <Label>Create — tworzenie nowej treści</Label>
          <Input placeholder="https://n8n.twoja-domena.com/webhook/content-create"
            value={s.n8n_webhook_create} onChange={(e) => setS({ ...s, n8n_webhook_create: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Regenerate — regeneracja etapu (script/voice/video)</Label>
          <Input placeholder="https://n8n.twoja-domena.com/webhook/content-regenerate"
            value={s.n8n_webhook_regenerate} onChange={(e) => setS({ ...s, n8n_webhook_regenerate: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Publish — publikacja na platformach</Label>
          <Input placeholder="https://n8n.twoja-domena.com/webhook/content-publish"
            value={s.n8n_webhook_publish} onChange={(e) => setS({ ...s, n8n_webhook_publish: e.target.value })} />
        </div>
      </Card>

      <Card className="p-5 mb-4 space-y-4">
        <div className="font-medium">Głos marki</div>
        <div className="space-y-2">
          <Label>Brand voice (opis stylu, ton, tematyka)</Label>
          <Textarea rows={5} value={s.brand_voice} onChange={(e) => setS({ ...s, brand_voice: e.target.value })}
            placeholder="np. Energiczny, młodzieżowy, edukacyjny — krótkie zdania, dużo metafor…" />
        </div>
        <div className="space-y-2">
          <Label>Default Voice ID (np. ElevenLabs)</Label>
          <Input value={s.default_voice_id} onChange={(e) => setS({ ...s, default_voice_id: e.target.value })} />
        </div>
      </Card>

      <Button onClick={save} disabled={saving}>{saving ? "Zapisywanie…" : "Zapisz"}</Button>

      <Card className="p-5 mt-8 bg-muted/20">
        <div className="flex items-center gap-2 font-medium mb-3"><Code2 className="w-4 h-4" /> Payloady webhooków n8n</div>
        <p className="text-sm text-muted-foreground mb-3">
          Workflow w n8n powinno przyjmować JSON z poniższych endpointów i zapisywać wyniki bezpośrednio do bazy (tabele: <code>content_items</code>, <code>content_platforms</code>, <code>analytics</code>, <code>trending_topics</code>).
        </p>
        <pre className="text-xs bg-background p-3 rounded-md overflow-auto border border-border">
{`POST /webhook/content-create
{ "content_id": "uuid", "user_id": "uuid", "title": "...", "idea": "..." }

POST /webhook/content-regenerate
{ "content_id": "uuid", "user_id": "uuid", "stage": "script" | "voice" | "video" }

POST /webhook/content-publish
{ "content_id": "uuid", "user_id": "uuid", "platforms": ["tiktok","reels","shorts"] }

# Cron w n8n: pobiera statystyki -> INSERT INTO analytics
# Cron w n8n: research trendów -> INSERT INTO trending_topics`}
        </pre>
      </Card>
    </div>
  );
}
