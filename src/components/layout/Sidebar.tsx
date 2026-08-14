import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Bot,
  PlusCircle,
  Rocket,
  Plug,
  Database,
  ShieldCheck,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, writeOnly: false },
  { to: "/agents", label: "Agents", icon: Bot, writeOnly: false },
  { to: "/agents/new", label: "Create Agent", icon: PlusCircle, writeOnly: true },
  { to: "/connectors", label: "Connectors", icon: Plug, writeOnly: false },
  {
    to: "/platform/knowledge-bases",
    label: "Knowledge Bases",
    icon: Database,
    writeOnly: false,
  },
  {
    to: "/platform/guardrail-policies",
    label: "Guardrail Policies",
    icon: ShieldCheck,
    writeOnly: false,
  },
  { to: "/deployments", label: "Deployments", icon: Rocket, writeOnly: false },
  { to: "/settings", label: "Platform Settings", icon: Settings, writeOnly: false },
];

export function Sidebar() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.currentUser);
  const logout = useAuthStore((state) => state.logout);
  const canWrite = currentUser?.role === "developer" || currentUser?.role === "admin";
  const visibleNavItems = NAV_ITEMS.filter((item) => !item.writeOnly || canWrite);

  return (
    <aside className="flex h-screen w-64 flex-col bg-navy text-white">
      <div className="flex h-16 items-center gap-2 border-b border-white/10 px-6">
        <div className="h-2.5 w-2.5 rounded-full bg-teal" />
        <span className="text-sm font-semibold tracking-wide">
          Panasa Agent Factory
        </span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {visibleNavItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white",
                isActive && "bg-teal/15 text-white",
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={18}
                  className={cn(isActive ? "text-teal" : "text-white/50")}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 px-6 py-4">
        {currentUser ? (
          <div className="mb-3 space-y-0.5">
            <div className="truncate text-sm font-medium text-white">
              {currentUser.email}
            </div>
            <div className="text-xs text-white/40">
              {currentUser.role} · {currentUser.tenant_id}
            </div>
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => {
            logout();
            navigate("/login", { replace: true });
          }}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-white/60 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut size={14} />
          Log out
        </button>
        <div className="pt-2 text-[10px] text-white/30">v1.0.0 · prototype</div>
      </div>
    </aside>
  );
}
