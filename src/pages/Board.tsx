import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useDroppable, useSensor, useSensors,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { STATUS_COLUMNS, ContentStatus, PLATFORMS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar as CalIcon, Hash } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type Item = {
  id: string;
  title: string;
  hook: string | null;
  status: ContentStatus;
  scheduled_at: string | null;
  thumbnail_url: string | null;
  hashtags: string[] | null;
};

function Card({ item }: { item: Item }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: item.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ opacity: isDragging ? 0.4 : 1 }}
      className="group relative rounded-lg border border-border bg-card p-3 cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors"
    >
      <Link
        to={`/content/${item.id}`}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        className="block"
      >
        <div className="aspect-vertical w-full bg-muted rounded-md overflow-hidden mb-2 flex items-center justify-center text-muted-foreground text-xs">
          {item.thumbnail_url ? (
            <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
          ) : (
            "9:16"
          )}
        </div>
        <div className="font-medium text-sm line-clamp-2 mb-1">{item.title}</div>
        {item.hook && <div className="text-xs text-muted-foreground line-clamp-2 mb-2">{item.hook}</div>}
        <div className="flex items-center gap-2 flex-wrap">
          {item.scheduled_at && (
            <Badge variant="secondary" className="text-[10px] gap-1">
              <CalIcon className="w-3 h-3" />
              {format(new Date(item.scheduled_at), "d MMM")}
            </Badge>
          )}
          {item.hashtags && item.hashtags.length > 0 && (
            <Badge variant="outline" className="text-[10px] gap-1">
              <Hash className="w-3 h-3" />
              {item.hashtags.length}
            </Badge>
          )}
        </div>
      </Link>
    </div>
  );
}

function Column({ id, label, color, items }: { id: ContentStatus; label: string; color: string; items: Item[] }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`w-72 shrink-0 rounded-xl p-3 border transition-colors ${
        isOver ? "bg-primary/5 border-primary/50" : "bg-card/40 border-border"
      }`}
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full bg-${color}`} />
          <span className="font-medium text-sm">{label}</span>
        </div>
        <span className="text-xs text-muted-foreground">{items.length}</span>
      </div>
      <div className="space-y-2 min-h-32">
        {items.map((it) => <Card key={it.id} item={it} />)}
      </div>
    </div>
  );
}

export default function Board() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newIdea, setNewIdea] = useState("");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    document.title = "Tablica treści — ViralForge";
  }, []);

  const load = async () => {
    const { data, error } = await supabase
      .from("content_items")
      .select("id,title,hook,status,scheduled_at,thumbnail_url,hashtags")
      .order("position", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setItems((data ?? []) as Item[]);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("content_items_board")
      .on("postgres_changes", { event: "*", schema: "public", table: "content_items" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const grouped = useMemo(() => {
    const m = new Map<ContentStatus, Item[]>();
    STATUS_COLUMNS.forEach((c) => m.set(c.id, []));
    items.forEach((i) => m.get(i.status)?.push(i));
    return m;
  }, [items]);

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const onDragEnd = async (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const newStatus = String(over.id) as ContentStatus;
    const item = items.find((i) => i.id === active.id);
    if (!item || item.status === newStatus) return;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: newStatus } : i)));
    const { error } = await supabase.from("content_items").update({ status: newStatus }).eq("id", item.id);
    if (error) {
      toast.error(error.message);
      load();
    }
  };

  const create = async () => {
    if (!user || !newTitle.trim()) return;
    const { error } = await supabase.from("content_items").insert({
      user_id: user.id,
      title: newTitle.trim(),
      idea: newIdea.trim() || null,
      status: "idea",
    });
    if (error) return toast.error(error.message);
    setOpen(false);
    setNewTitle("");
    setNewIdea("");
    toast.success("Dodano nowy pomysł");
  };

  const active = items.find((i) => i.id === activeId);

  return (
    <div className="p-6 h-full flex flex-col">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Tablica treści</h1>
          <p className="text-sm text-muted-foreground">Zarządzaj produkcją od pomysłu do publikacji</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Nowy pomysł</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nowy pomysł na content</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tytuł</Label>
                <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="np. Top 5 tricków AI" />
              </div>
              <div className="space-y-2">
                <Label>Pomysł / temat</Label>
                <Textarea value={newIdea} onChange={(e) => setNewIdea(e.target.value)} placeholder="O czym ma być wideo?" rows={4} />
              </div>
              <div className="text-xs text-muted-foreground">
                Platformy: {PLATFORMS.map((p) => p.label).join(" · ")} — wybierzesz w szczegółach.
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Anuluj</Button>
              <Button onClick={create}>Utwórz</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
          {STATUS_COLUMNS.map((col) => (
            <Column key={col.id} id={col.id} label={col.label} color={col.color} items={grouped.get(col.id) ?? []} />
          ))}
        </div>
        <DragOverlay>
          {active ? <Card item={active} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
