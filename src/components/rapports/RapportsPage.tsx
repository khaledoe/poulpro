"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { Download, BarChart3 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from "recharts";
import { formatNumber } from "@/lib/utils";

interface Production { id: string; date: string | Date; oeufsTotaux: number; oeufsCasses: number; oeufsSales: number; troupeau: { id: string; nom: string; nombreActuel: number }; }
interface Mortalite { id: string; date: string | Date; nombre: number; cause: string | null; troupeau: { id: string; nom: string }; }
interface LigneVente { id: string; produit: string; quantite: number; prixUnitaire: number; total: number; }
interface Vente { id: string; date: string | Date; total: number; montantPaye: number; statut: string; client: { id: string; nom: string }; lignes: LigneVente[]; }
interface Achat { id: string; date: string | Date; quantite: number; prixUnitaire: number; aliment: { id: string; nom: string; unite: string }; }

export function RapportsPage({ productions, mortalites, ventes, achats }: {
  productions: Production[]; mortalites: Mortalite[]; ventes: Vente[]; achats: Achat[];
}) {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));

  const monthDate = new Date(selectedMonth + "-01");
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);

  const filteredProd = productions.filter((p) => {
    const d = new Date(p.date);
    return d >= monthStart && d <= monthEnd;
  });
  const filteredMort = mortalites.filter((m) => {
    const d = new Date(m.date);
    return d >= monthStart && d <= monthEnd;
  });
  const filteredVentes = ventes.filter((v) => {
    const d = new Date(v.date);
    return d >= monthStart && d <= monthEnd;
  });
  const filteredAchats = achats.filter((a) => {
    const d = new Date(a.date);
    return d >= monthStart && d <= monthEnd;
  });

  const totalOeufs = filteredProd.reduce((s, p) => s + p.oeufsTotaux, 0);
  const totalMorts = filteredMort.reduce((s, m) => s + m.nombre, 0);
  const totalVentes = filteredVentes.reduce((s, v) => s + v.montantPaye, 0);
  const totalAchats = filteredAchats.reduce((s, a) => s + a.quantite * a.prixUnitaire, 0);
  const benefice = totalVentes - totalAchats;

  // Daily chart data
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const dailyData = days.map((d) => {
    const key = format(d, "yyyy-MM-dd");
    const dayProd = filteredProd.filter((p) => format(new Date(p.date), "yyyy-MM-dd") === key).reduce((s, p) => s + p.oeufsTotaux, 0);
    const dayMort = filteredMort.filter((m) => format(new Date(m.date), "yyyy-MM-dd") === key).reduce((s, m) => s + m.nombre, 0);
    const dayVentes = filteredVentes.filter((v) => format(new Date(v.date), "yyyy-MM-dd") === key).reduce((s, v) => s + v.montantPaye, 0);
    return { date: format(d, "dd"), oeufs: dayProd, mortalites: dayMort, recettes: dayVentes };
  });

  function exportCSV() {
    const rows = [
      ["Date", "Type", "Détail", "Valeur", "Unité"],
      ...filteredProd.map((p) => [format(new Date(p.date), "dd/MM/yyyy"), "Production", p.troupeau.nom, p.oeufsTotaux, "œufs"]),
      ...filteredMort.map((m) => [format(new Date(m.date), "dd/MM/yyyy"), "Mortalité", m.troupeau.nom, m.nombre, "poules"]),
      ...filteredVentes.map((v) => [format(new Date(v.date), "dd/MM/yyyy"), "Vente", v.client.nom, v.montantPaye, "FCFA"]),
      ...filteredAchats.map((a) => [format(new Date(a.date), "dd/MM/yyyy"), "Achat aliment", a.aliment.nom, a.quantite * a.prixUnitaire, "FCFA"]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `rapport-${selectedMonth}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Rapports</h2>
          <p className="text-slate-500 text-sm">{format(monthDate, "MMMM yyyy", { locale: fr })}</p>
        </div>
        <div className="flex gap-2 items-center">
          <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500" />
          <button onClick={exportCSV} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-medium">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Œufs produits", value: formatNumber(totalOeufs), unit: "œufs", color: "text-yellow-600" },
          { label: "Mortalités", value: formatNumber(totalMorts), unit: "poules", color: "text-red-600" },
          { label: "Recettes", value: formatNumber(Math.round(totalVentes)), unit: "FCFA", color: "text-green-600" },
          { label: benefice >= 0 ? "Bénéfice" : "Perte", value: formatNumber(Math.round(Math.abs(benefice))), unit: "FCFA", color: benefice >= 0 ? "text-green-600" : "text-red-600" },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 font-medium">{c.label}</p>
            <p className={`text-2xl font-bold mt-1 ${c.color}`}>{c.value}</p>
            <p className="text-xs text-slate-400">{c.unit}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={16} className="text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-700">Production journalière</h3>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="oeufs" name="Œufs" stroke="#eab308" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="mortalites" name="Mortalités" stroke="#ef4444" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Recettes journalières (FCFA)</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="recettes" name="Recettes" fill="#16a34a" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tables résumé */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Top clients du mois</h3>
          <div className="space-y-2">
            {Object.entries(filteredVentes.reduce((acc: Record<string, number>, v) => {
              acc[v.client.nom] = (acc[v.client.nom] ?? 0) + v.montantPaye;
              return acc;
            }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([nom, total]) => (
              <div key={nom} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{nom}</span>
                <span className="font-semibold text-green-600">{formatNumber(Math.round(total))} FCFA</span>
              </div>
            ))}
            {filteredVentes.length === 0 && <p className="text-slate-400 text-sm">Aucune vente ce mois</p>}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Mortalités par cause</h3>
          <div className="space-y-2">
            {Object.entries(filteredMort.reduce((acc: Record<string, number>, m) => {
              const cause = m.cause ?? "Inconnue";
              acc[cause] = (acc[cause] ?? 0) + m.nombre;
              return acc;
            }, {})).sort((a, b) => b[1] - a[1]).map(([cause, total]) => (
              <div key={cause} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{cause}</span>
                <span className="font-semibold text-red-600">{formatNumber(total)} poules</span>
              </div>
            ))}
            {filteredMort.length === 0 && <p className="text-slate-400 text-sm">Aucune mortalité ce mois</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
