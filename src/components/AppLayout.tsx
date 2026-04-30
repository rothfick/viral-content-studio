import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutGrid, Calendar, BarChart3, TrendingUp, Settings, Sparkles, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Tablica", icon: LayoutGrid, end: true },
  { to: "/calendar", label: "Kalendarz", icon: Calendar },
  { to: "/analytics", label: "Statystyki", icon: BarChart3 },
  { to: "/trends", label: "Trendy", icon: TrendingUp },
  { to: "/settings", label: "Ustawienia", icon: Settings },
];

export default function AppLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex w-full">
      <aside className="w-60 shrink-0 border-r border-border bg-sidebar flex flex-col">
        <div className="p-5 flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-semibold gradient-text text-lg leading-none">ViralForge</div>
            <div className="text-xs text-muted-foreground mt-1">Content OS</div>
          </div>
        </div>
        <nav className="px-3 py-4 flex-1 space-y-1">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <div className="px-2 py-2 text-xs text-muted-foreground truncate">{user?.email}</div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={async () => {
              await signOut();
              navigate("/auth");
            }}
          >
            <LogOut className="w-4 h-4" /> Wyloguj
          </Button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
