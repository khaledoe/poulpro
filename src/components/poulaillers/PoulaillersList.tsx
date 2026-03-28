"use client";

import { useState } from "react";
import { Plus, Building2, Pencil, Trash2, Users } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import toast from "react-hot-toast";
import { formatNumber } from "@/lib/utils";

interface Troupeau {
  id: string;
  nom: string;
  nombreActuel: number;
}

interface Poulailler {
  id: string;
  nom: string;
  capacite: number;
  description: string | null;
  actif: boolean;
  troupeaux: Troupeau[];
}

export function PoulaillersList({ initialData }: { initialData: Poulailler[] }) {
  const [poulaillers, setPoulaillers] = useState(initialData);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Poulailler | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const data = { nom: fd.get("nom"), capacite: fd.get("capacite"), description: fd.get("description") };

    try {
      let res;
      if (editing) {
        res = await fetch(`/api/poulaillers/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      } else {
        res = await fetch("/api/poulaillers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      }
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      if (editing) {
        setPoulaillers((p) => p.map((x) => (x.id === editing.id ? { ...x, ...result } : x)));
        toast.success("Poulailler modifié");
      } else {
        setPoulaillers((p) => [...p, { ...result, troupeaux: [] }]);
        toast.success("Poulailler ajouté");
      }
      setModalOpen(false);
      setEditing(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce poulailler ?")) return;
    await fetch(`/api/poulaillers/${id}`, { method: "DELETE" });
    setPoulaillers((p) => p.filter((x) => x.id !== id));
    toast.success("Supprimé");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Poulaillers</h2>
          <p className="text-slate-500 text-sm">{poulaillers.length} bâtiment(s)</p>
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium"
        >
          <Plus size={16} /> Ajouter
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {poulaillers.map((p) => {
          const totalPoules = p.troupeaux.reduce((s, t) => s + t.nombreActuel, 0);
          const pct = Math.min(100, Math.round((totalPoules / p.capacite) * 100));
          return (
            <div key={p.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Building2 size={20} className="text-green-600" />
                  <h3 className="font-semibold text-slate-800">{p.nom}</h3>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(p); setModalOpen(true); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <p className="text-sm text-slate-500 mb-4">{p.description ?? "Pas de description"}</p>

              <div className="flex items-center gap-2 mb-2">
                <Users size={14} className="text-slate-400" />
                <span className="text-sm text-slate-600">{formatNumber(totalPoules)} / {formatNumber(p.capacite)} poules</span>
              </div>

              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${pct > 90 ? "bg-red-500" : pct > 70 ? "bg-yellow-500" : "bg-green-500"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">{pct}% d'occupation</p>

              {p.troupeaux.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-500 font-medium mb-1">Troupeaux :</p>
                  {p.troupeaux.map((t) => (
                    <span key={t.id} className="inline-block text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full mr-1 mb-1">
                      {t.nom}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {poulaillers.length === 0 && (
          <div className="col-span-full text-center py-16 text-slate-400">
            <Building2 size={40} className="mx-auto mb-3 opacity-30" />
            <p>Aucun poulailler. Commencez par en ajouter un.</p>
          </div>
        )}
      </div>

      <Modal
        title={editing ? "Modifier le poulailler" : "Nouveau poulailler"}
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Nom" name="nom" required placeholder="Bâtiment A" defaultValue={editing?.nom} />
          <FormField label="Capacité (nombre de poules)" name="capacite" type="number" required placeholder="1000" defaultValue={editing?.capacite} />
          <FormField label="Description" name="description" placeholder="Description optionnelle" defaultValue={editing?.description ?? ""} />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setModalOpen(false); setEditing(null); }} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium">
              Annuler
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium disabled:opacity-60">
              {loading ? "..." : editing ? "Modifier" : "Ajouter"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
