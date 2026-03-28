"use client";

import { useState } from "react";
import { Plus, Egg, TrendingUp } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { FormField, SelectField } from "@/components/ui/FormField";
import toast from "react-hot-toast";
import { formatDate, formatNumber, tauxPonte } from "@/lib/utils";

interface Troupeau { id: string; nom: string; nombreActuel: number; }
interface Production {
  id: string; date: string | Date; oeufsTotaux: number; oeufsCasses: number; oeufsSales: number;
  notes: string | null;
  troupeau: Troupeau;
}

export function ProductionPage({ initialData, troupeaux }: { initialData: Production[]; troupeaux: Troupeau[] }) {
  const [productions, setProductions] = useState(initialData);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const total7j = productions
    .filter((p) => new Date(p.date) >= new Date(Date.now() - 7 * 86400000))
    .reduce((s, p) => s + p.oeufsTotaux, 0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const data = {
      date: fd.get("date"), troupeauId: fd.get("troupeauId"),
      oeufsTotaux: fd.get("oeufsTotaux"), oeufsCasses: fd.get("oeufsCasses"),
      oeufsSales: fd.get("oeufsSales"), notes: fd.get("notes"),
    };
    try {
      const res = await fetch("/api/production", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setProductions((p) => {
        const filtered = p.filter((x) => !(x.troupeau.id === result.troupeauId && formatDate(x.date) === formatDate(result.date)));
        return [result, ...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      });
      toast.success("Production enregistrée");
      setModalOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally { setLoading(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Production d'œufs</h2>
          <p className="text-slate-500 text-sm">{formatNumber(total7j)} œufs ces 7 derniers jours</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium">
          <Plus size={16} /> Saisir
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Troupeau</th>
                <th className="px-4 py-3 text-right">Total œufs</th>
                <th className="px-4 py-3 text-right">Cassés</th>
                <th className="px-4 py-3 text-right">Sales</th>
                <th className="px-4 py-3 text-right">Taux ponte</th>
                <th className="px-4 py-3 text-left">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {productions.map((p) => {
                const tp = tauxPonte(p.oeufsTotaux, p.troupeau.nombreActuel);
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(p.date)}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{p.troupeau.nom}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="flex items-center justify-end gap-1 font-semibold text-slate-800">
                        <Egg size={12} className="text-yellow-500" />{formatNumber(p.oeufsTotaux)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-red-500">{p.oeufsCasses > 0 ? formatNumber(p.oeufsCasses) : "—"}</td>
                    <td className="px-4 py-3 text-right text-orange-500">{p.oeufsSales > 0 ? formatNumber(p.oeufsSales) : "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${tp >= 80 ? "bg-green-100 text-green-700" : tp >= 60 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                        <TrendingUp size={10} />{tp}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{p.notes ?? "—"}</td>
                  </tr>
                );
              })}
              {productions.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">Aucune production enregistrée</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal title="Saisir la production" open={modalOpen} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Date" name="date" type="date" required defaultValue={new Date().toISOString().split("T")[0]} />
          <SelectField label="Troupeau" name="troupeauId" required options={troupeaux.map((t) => ({ value: t.id, label: `${t.nom} (${formatNumber(t.nombreActuel)} poules)` }))} />
          <FormField label="Nombre total d'œufs" name="oeufsTotaux" type="number" required placeholder="0" />
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Œufs cassés" name="oeufsCasses" type="number" placeholder="0" defaultValue={0} />
            <FormField label="Œufs sales" name="oeufsSales" type="number" placeholder="0" defaultValue={0} />
          </div>
          <FormField label="Notes" name="notes" placeholder="Remarques..." />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium">Annuler</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium disabled:opacity-60">
              {loading ? "..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
