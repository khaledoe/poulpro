"use client";

import { useState } from "react";
import { Plus, Bird, Pencil, Trash2, Calendar } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { FormField, SelectField } from "@/components/ui/FormField";
import toast from "react-hot-toast";
import { formatNumber, formatDate } from "@/lib/utils";

interface Poulailler { id: string; nom: string; }
interface Troupeau {
  id: string; nom: string; race: string; nombreDebut: number; nombreActuel: number;
  dateArrivee: string | Date; actif: boolean;
  poulailler: Poulailler;
}

export function TroupeauxList({ initialData, poulaillers }: { initialData: Troupeau[]; poulaillers: Poulailler[] }) {
  const [troupeaux, setTroupeaux] = useState(initialData);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Troupeau | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const data = {
      nom: fd.get("nom"), race: fd.get("race"),
      nombreDebut: fd.get("nombreDebut"), poulaillerId: fd.get("poulaillerId"),
      dateArrivee: fd.get("dateArrivee"),
    };
    try {
      let res;
      if (editing) {
        res = await fetch(`/api/troupeaux/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      } else {
        res = await fetch("/api/troupeaux", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      }
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      if (editing) {
        setTroupeaux((p) => p.map((x) => (x.id === editing.id ? result : x)));
        toast.success("Troupeau modifié");
      } else {
        setTroupeaux((p) => [...p, result]);
        toast.success("Troupeau ajouté");
      }
      setModalOpen(false); setEditing(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally { setLoading(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Archiver ce troupeau ?")) return;
    await fetch(`/api/troupeaux/${id}`, { method: "DELETE" });
    setTroupeaux((p) => p.filter((x) => x.id !== id));
    toast.success("Troupeau archivé");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Troupeaux</h2>
          <p className="text-slate-500 text-sm">{troupeaux.length} lot(s) actif(s)</p>
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true); }} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium">
          <Plus size={16} /> Ajouter
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Troupeau</th>
                <th className="px-4 py-3 text-left">Race</th>
                <th className="px-4 py-3 text-left">Poulailler</th>
                <th className="px-4 py-3 text-right">Début</th>
                <th className="px-4 py-3 text-right">Actuel</th>
                <th className="px-4 py-3 text-left">Arrivée</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {troupeaux.map((t) => {
                const pertes = t.nombreDebut - t.nombreActuel;
                const pctPerte = t.nombreDebut > 0 ? Math.round((pertes / t.nombreDebut) * 100) : 0;
                return (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800 flex items-center gap-2">
                      <Bird size={14} className="text-green-500" /> {t.nom}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{t.race}</td>
                    <td className="px-4 py-3 text-slate-600">{t.poulailler.nom}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatNumber(t.nombreDebut)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-slate-800">{formatNumber(t.nombreActuel)}</span>
                      {pctPerte > 0 && <span className="ml-1 text-xs text-red-500">-{pctPerte}%</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      <span className="flex items-center gap-1"><Calendar size={12} />{formatDate(t.dateArrivee)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => { setEditing(t); setModalOpen(true); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><Pencil size={14} /></button>
                        <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {troupeaux.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">Aucun troupeau actif</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal title={editing ? "Modifier le troupeau" : "Nouveau troupeau"} open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Nom du lot" name="nom" required placeholder="Lot A 2024" defaultValue={editing?.nom} />
          <FormField label="Race" name="race" required placeholder="ISA Brown, Lohmann, etc." defaultValue={editing?.race} />
          <FormField label="Nombre de poules à l'arrivée" name="nombreDebut" type="number" required placeholder="1000" defaultValue={editing?.nombreDebut} />
          <SelectField label="Poulailler" name="poulaillerId" required defaultValue={editing?.poulailler.id}
            options={poulaillers.map((p) => ({ value: p.id, label: p.nom }))} />
          <FormField label="Date d'arrivée" name="dateArrivee" type="date" required
            defaultValue={editing ? new Date(editing.dateArrivee).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]} />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setModalOpen(false); setEditing(null); }} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium">Annuler</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium disabled:opacity-60">
              {loading ? "..." : editing ? "Modifier" : "Ajouter"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
