"use client";

import { useState } from "react";
import { Plus, AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { FormField, SelectField } from "@/components/ui/FormField";
import toast from "react-hot-toast";
import { formatDate, formatNumber } from "@/lib/utils";

interface Troupeau { id: string; nom: string; nombreActuel: number; }
interface Mortalite {
  id: string; date: string | Date; nombre: number; cause: string | null; notes: string | null;
  troupeau: { id: string; nom: string };
}

const CAUSES = ["Maladie", "Chaleur", "Froid", "Prédateur", "Accident", "Inconnu", "Autre"];

export function MortalitesPage({ initialData, troupeaux }: { initialData: Mortalite[]; troupeaux: Troupeau[] }) {
  const [mortalites, setMortalites] = useState(initialData);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const total30j = mortalites
    .filter((m) => new Date(m.date) >= new Date(Date.now() - 30 * 86400000))
    .reduce((s, m) => s + m.nombre, 0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const data = {
      date: fd.get("date"), troupeauId: fd.get("troupeauId"),
      nombre: fd.get("nombre"), cause: fd.get("cause"), notes: fd.get("notes"),
    };
    try {
      const res = await fetch("/api/mortalites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setMortalites((p) => [result, ...p]);
      toast.success("Mortalité enregistrée");
      setModalOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally { setLoading(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Mortalités</h2>
          <p className="text-slate-500 text-sm">{formatNumber(total30j)} perte(s) ces 30 derniers jours</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-medium">
          <Plus size={16} /> Enregistrer
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Troupeau</th>
                <th className="px-4 py-3 text-right">Nombre</th>
                <th className="px-4 py-3 text-left">Cause</th>
                <th className="px-4 py-3 text-left">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {mortalites.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(m.date)}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{m.troupeau.nom}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="flex items-center justify-end gap-1 text-red-600 font-semibold">
                      <AlertTriangle size={12} />{formatNumber(m.nombre)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {m.cause && (
                      <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full">{m.cause}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{m.notes ?? "—"}</td>
                </tr>
              ))}
              {mortalites.length === 0 && (
                <tr><td colSpan={5} className="text-center py-12 text-slate-400">Aucune mortalité enregistrée</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal title="Enregistrer une mortalité" open={modalOpen} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Date" name="date" type="date" required defaultValue={new Date().toISOString().split("T")[0]} />
          <SelectField label="Troupeau" name="troupeauId" required options={troupeaux.map((t) => ({ value: t.id, label: `${t.nom} (${formatNumber(t.nombreActuel)} poules)` }))} />
          <FormField label="Nombre de décès" name="nombre" type="number" required placeholder="1" />
          <SelectField label="Cause" name="cause" options={CAUSES.map((c) => ({ value: c, label: c }))} />
          <FormField label="Notes" name="notes" placeholder="Remarques..." />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium">Annuler</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-60">
              {loading ? "..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
