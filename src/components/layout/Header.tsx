"use client";

import { Menu, LogOut, User } from "lucide-react";
import { logout } from "@/app/actions/auth";

interface HeaderProps {
  userName: string;
  onMenuClick: () => void;
  title: string;
}

export function Header({ userName, onMenuClick, title }: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100">
          <User size={14} className="text-slate-500" />
          <span className="text-sm text-slate-700 font-medium">{userName}</span>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </form>
      </div>
    </header>
  );
}
