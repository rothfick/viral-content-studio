import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  format, isSameMonth, isSameDay, addMonths, subMonths, parseISO,
} from "date-fns";
import { pl } from "date-fns/locale";
import { PLATFORMS } from "@/lib/constants";

type Sched = { id: string; title: string; scheduled_at: string; status: string; thumbnail_url: string | null };

export default function CalendarPage() {
  const [cursor, setCursor] = useState(new Date());
  const [items, setItems] = useState<Sched[]>([]);

  useEffect(() => { document.title = "Kalendarz publikacji — ViralForge"; }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("content_items")
        .select("id,title,scheduled_at,status,thumbnail_url")
        .not("scheduled_at", "is", null)
        .order("scheduled_at", { ascending: true });
      setItems((data ?? []) as Sched[]);
    })();
  }, [cursor]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const itemsByDay = useMemo(() => {
    const m = new Map<string, Sched[]>();
    items.forEach((i) => {
      const k = format(parseISO(i.scheduled_at), "yyyy-MM-dd");
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(i);
    });
    return m;
  }, [items]);

  return (
    <div className="p-6">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Kalendarz publikacji</h1>
          <p className="text-sm text-muted-foreground">Planuj kiedy publikujesz</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setCursor(subMonths(cursor, 1))}><ChevronLeft className="w-4 h-4" /></Button>
          <div className="font-medium min-w-40 text-center capitalize">{format(cursor, "LLLL yyyy", { locale: pl })}</div>
          <Button variant="ghost" size="icon" onClick={() => setCursor(addMonths(cursor, 1))}><ChevronRight className="w-4 h-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>Dziś</Button>
        </div>
      </header>

      <Card className="p-4">
        <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
          {["Pon","Wt","Śr","Czw","Pt","Sob","Nd"].map((d) => (
            <div key={d} className="bg-card px-2 py-2 text-xs font-medium text-muted-foreground text-center">{d}</div>
          ))}
          {days.map((day) => {
            const k = format(day, "yyyy-MM-dd");
            const dayItems = itemsByDay.get(k) ?? [];
            const inMonth = isSameMonth(day, cursor);
            const today = isSameDay(day, new Date());
            return (
              <div key={k} className={`bg-card min-h-28 p-2 ${!inMonth ? "opacity-40" : ""}`}>
                <div className={`text-xs mb-1 ${today ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                  {format(day, "d")}
                </div>
                <div className="space-y-1">
                  {dayItems.slice(0, 3).map((it) => (
                    <Link key={it.id} to={`/content/${it.id}`}
                      className="block text-[11px] truncate px-1.5 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20">
                      {format(parseISO(it.scheduled_at), "HH:mm")} · {it.title}
                    </Link>
                  ))}
                  {dayItems.length > 3 && <div className="text-[10px] text-muted-foreground px-1">+{dayItems.length - 3} więcej</div>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="mt-6 flex flex-wrap gap-3 text-xs text-muted-foreground">
        {PLATFORMS.map((p) => (
          <div key={p.id} className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full bg-${p.color}`} /> {p.label}
          </div>
        ))}
      </div>
    </div>
  );
}
