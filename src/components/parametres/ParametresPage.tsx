"use client";

import { useState } from "react";
import { Plus, Users, Trash2, ShieldCheck } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { FormField, SelectField } from "@/components/ui/FormField";
import toast from "react-hot-toast";
import { formatDate } from "@/lib/utils";

interface User { id: string; name: string; email: string; role: string; createdAt: string | Date; }

const roleLabels: Record<string, string> = { ADMIN: "Administrateur", MANAGER: "Gestionnaire", WORKER: "Employé" };
const roleColors: Record<string, string> = { ADMIN: "bg-red-100 text-red-700", MANAGER: "bg-blue-100 text-blue-700", WORKER: "bg-slate-100 text-slate-700" };

export function ParametresPage({ users: initialUsers, currentUserId }: { users: User[]; currentUserId: string }) {
  const [users, setUsers] = useState(initialUsers);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleAddUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fd.get("name"), email: fd.get("email"), password: fd.get("password"), role: fd.get("role") }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setUsers((u) => [...u, result]);
      toast.success("Utilisateur ajouté");
      setModalOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally { setLoading(false); }
  }

  async function handleDelete(id: string) {
    if (id === currentUserId) { toast.error("Vous ne pouvez pas supprimer votre propre compte"); return; }
    if (!confirm("Supprimer cet utilisateur ?")) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) { setUsers((u) => u.filter((x) => x.id !== id)); toast.success("Supprimé"); }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Paramètres</h2>
        <p className="text-slate-500 text-sm">Gestion des utilisateurs</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-slate-500" />
            <h3 className="font-semibold text-slate-800">Utilisateurs ({users.length})</h3>
          </div>
          <button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-xl text-sm font-medium">
            <Plus size={14} /> Ajouter
          </button>
        </div>

        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-semibold">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{u.name} {u.id === currentUserId && <span className="text-xs text-slate-400">(vous)</span>}</p>
                  <p className="text-xs text-slate-500">{u.email} · {formatDate(u.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${roleColors[u.role]}`}>
                  {u.role === "ADMIN" && <ShieldCheck size={10} />}{roleLabels[u.role]}
                </span>
                {u.id !== currentUserId && (
                  <button onClick={() => handleDelete(u.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 size={14} /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal title="Nouvel utilisateur" open={modalOpen} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleAddUser} className="space-y-4">
          <FormField label="Nom complet" name="name" required placeholder="Prénom Nom" />
          <FormField label="Email" name="email" type="email" required placeholder="email@exemple.com" />
          <FormField label="Mot de passe" name="password" type="password" required placeholder="Minimum 6 caractères" />
          <SelectField label="Rôle" name="role" required defaultValue="WORKER"
            options={[{ value: "ADMIN", label: "Administrateur" }, { value: "MANAGER", label: "Gestionnaire" }, { value: "WORKER", label: "Employé" }]} />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium">Annuler</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium disabled:opacity-60">{loading ? "..." : "Ajouter"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
