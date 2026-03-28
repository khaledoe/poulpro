"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Bird,
  Egg,
  HeartPulse,
  Wheat,
  ShoppingCart,
  FileBarChart2,
  Settings,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/dashboard/poulaillers", label: "Poulaillers", icon: Building2 },
  { href: "/dashboard/troupeaux", label: "Troupeaux", icon: Bird },
  { href: "/dashboard/production", label: "Production", icon: Egg },
  { href: "/dashboard/mortalites", label: "Mortalités", icon: HeartPulse },
  { href: "/dashboard/alimentation", label: "Alimentation", icon: Wheat },
  { href: "/dashboard/ventes", label: "Ventes", icon: ShoppingCart },
  { href: "/dashboard/rapports", label: "Rapports", icon: FileBarChart2 },
  { href: "/dashboard/parametres", label: "Paramètres", icon: Settings },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-slate-900 text-white z-30 flex flex-col transition-transform duration-200",
          "lg:relative lg:translate-x-0 lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="bg-green-600 p-2 rounded-xl">
              <Egg size={20} />
            </div>
            <span className="text-lg font-bold">PoulPro</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm font-medium transition-colors",
                  active
                    ? "bg-green-600 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-6 py-4 border-t border-slate-700 text-xs text-slate-500">
          PoulPro v1.0 — Gestion Avicole
        </div>
      </aside>
    </>
  );
}
