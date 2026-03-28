"use client";

import { useActionState } from "react";
import { setupAdmin } from "@/app/actions/auth";
import { Egg } from "lucide-react";

export default function SetupPage() {
  const [state, action, pending] = useActionState(setupAdmin, {});

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-green-600 text-white p-3 rounded-2xl mb-4">
              <Egg size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Configuration initiale</h1>
            <p className="text-slate-500 text-sm mt-1 text-center">Créez votre compte administrateur pour commencer</p>
          </div>

          <form action={action} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet</label>
              <input
                type="text"
                name="name"
                required
                placeholder="Votre nom"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                required
                placeholder="admin@exemple.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                placeholder="Minimum 6 caractères"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-800"
              />
            </div>

            {state?.error && (
              <p className="text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg">{state.error}</p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {pending ? "Création..." : "Créer le compte admin"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
