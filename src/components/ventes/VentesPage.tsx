"use client";

import { useState } from "react";
import { Plus, ShoppingCart, User, CheckCircle, Clock, XCircle, CreditCard } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { FormField, SelectField } from "@/components/ui/FormField";
import toast from "react-hot-toast";
import { formatDate, formatNumber } from "@/lib/utils";

interface Client { id: string; nom: string; telephone?: string | null; email?: string | null; }
interface LigneVente { id: string; produit: string; quantite: number; prixUnitaire: number; total: number; }
interface Vente {
  id: string; date: string | Date; total: number; montantPaye: number; statut: string; notes: string | null;
  client: { id: string; nom: string };
  lignes: LigneVente[];
}

const statutColors: Record<string, string> = {
  PAYEE: "bg-green-100 text-green-700",
  EN_ATTENTE: "bg-yellow-100 text-yellow-700",
  PARTIELLE: "bg-blue-100 text-blue-700",
  ANNULEE: "bg-red-100 text-red-700",
};
const statutLabels: Record<string, string> = { PAYEE: "Payée", EN_ATTENTE: "En attente", PARTIELLE: "Partielle", ANNULEE: "Annulée" };
const statutIcons: Record<string, React.ReactNode> = {
  PAYEE: <CheckCircle size={12} />, EN_ATTENTE: <Clock size={12} />,
  PARTIELLE: <CreditCard size={12} />, ANNULEE: <XCircle size={12} />,
};

const PRODUITS = ["Œufs (plateau)", "Œufs (unité)", "Poules réformées", "Fumier", "Autre"];

export function VentesPage({ initialVentes, initialClients }: { initialVentes: Vente[]; initialClients: Client[] }) {
  const [ventes, setVentes] = useState(initialVentes);
  const [clients, setClients] = useState(initialClients);
  const [modalType, setModalType] = useState<"vente" | "client" | "paiement" | null>(null);
  const [selectedVente, setSelectedVente] = useState<Vente | null>(null);
  const [loading, setLoading] = useState(false);
  const [lignes, setLignes] = useState([{ produit: "", quantite: 1, prixUnitaire: 0 }]);

  const totalImpaye = ventes.filter((v) => v.statut !== "PAYEE" && v.statut !== "ANNULEE").reduce((s, v) => s + (v.total - v.montantPaye), 0);
  const totalMois = ventes.filter((v) => {
    const d = new Date(v.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((s, v) => s + v.montantPaye, 0);

  async function handleVente(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const data = {
      date: fd.get("date"), clientId: fd.get("clientId"),
      montantPaye: fd.get("montantPaye"), notes: fd.get("notes"),
      lignes: lignes.filter((l) => l.produit && l.quantite > 0),
    };
    try {
      const res = await fetch("/api/ventes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setVentes((v) => [result, ...v]);
      toast.success("Vente créée");
      setModalType(null);
      setLignes([{ produit: "", quantite: 1, prixUnitaire: 0 }]);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally { setLoading(false); }
  }

  async function handleClient(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nom: fd.get("nom"), telephone: fd.get("telephone"), email: fd.get("email"), adresse: fd.get("adresse") }) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setClients((c) => [...c, result].sort((a, b) => a.nom.localeCompare(b.nom)));
      toast.success("Client ajouté");
      setModalType(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally { setLoading(false); }
  }

  async function handlePaiement(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedVente) return;
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch(`/api/ventes/${selectedVente.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ montantPaye: fd.get("montantPaye") }) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setVentes((v) => v.map((x) => x.id === result.id ? result : x));
      toast.success("Paiement enregistré");
      setModalType(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally { setLoading(false); }
  }

  const totalLignes = lignes.reduce((s, l) => s + l.quantite * l.prixUnitaire, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Ventes</h2>
          <p className="text-slate-500 text-sm">Ce mois: {formatNumber(Math.round(totalMois))} FCFA encaissés · {formatNumber(Math.round(totalImpaye))} FCFA impayés</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setModalType("client")} className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-xl text-sm font-medium">
            <User size={14} /> Client
          </button>
          <button onClick={() => setModalType("vente")} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium">
            <Plus size={16} /> Nouvelle vente
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Client</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Payé</th>
                <th className="px-4 py-3 text-right">Reste</th>
                <th className="px-4 py-3 text-center">Statut</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {ventes.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(v.date)}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{v.client.nom}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatNumber(Math.round(v.total))} <span className="text-xs font-normal text-slate-400">FCFA</span></td>
                  <td className="px-4 py-3 text-right text-green-600">{formatNumber(Math.round(v.montantPaye))}</td>
                  <td className="px-4 py-3 text-right text-red-500">{v.total - v.montantPaye > 0 ? formatNumber(Math.round(v.total - v.montantPaye)) : "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${statutColors[v.statut]}`}>
                      {statutIcons[v.statut]}{statutLabels[v.statut]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {v.statut !== "PAYEE" && v.statut !== "ANNULEE" && (
                      <button onClick={() => { setSelectedVente(v); setModalType("paiement"); }} className="text-xs text-blue-600 hover:underline">Payer</button>
                    )}
                  </td>
                </tr>
              ))}
              {ventes.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-slate-400">Aucune vente enregistrée</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Vente */}
      <Modal title="Nouvelle vente" open={modalType === "vente"} onClose={() => { setModalType(null); setLignes([{ produit: "", quantite: 1, prixUnitaire: 0 }]); }}>
        <form onSubmit={handleVente} className="space-y-4">
          <FormField label="Date" name="date" type="date" required defaultValue={new Date().toISOString().split("T")[0]} />
          <SelectField label="Client" name="clientId" required options={clients.map((c) => ({ value: c.id, label: c.nom }))} />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Lignes de vente</label>
            <div className="space-y-2">
              {lignes.map((l, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <select value={l.produit} onChange={(e) => setLignes((prev) => prev.map((x, j) => j === i ? { ...x, produit: e.target.value } : x))}
                      className="w-full px-2 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-green-500">
                      <option value="">Produit</option>
                      {PRODUITS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <input type="number" placeholder="Qté" value={l.quantite} onChange={(e) => setLignes((prev) => prev.map((x, j) => j === i ? { ...x, quantite: Number(e.target.value) } : x))}
                      className="w-full px-2 py-2 rounded-lg border border-slate-200 text-sm text-right focus:outline-none focus:ring-1 focus:ring-green-500" />
                  </div>
                  <div className="col-span-3">
                    <input type="number" placeholder="Prix" value={l.prixUnitaire} onChange={(e) => setLignes((prev) => prev.map((x, j) => j === i ? { ...x, prixUnitaire: Number(e.target.value) } : x))}
                      className="w-full px-2 py-2 rounded-lg border border-slate-200 text-sm text-right focus:outline-none focus:ring-1 focus:ring-green-500" />
                  </div>
                  <button type="button" onClick={() => setLignes((prev) => prev.filter((_, j) => j !== i))} disabled={lignes.length === 1} className="col-span-1 text-red-400 hover:text-red-600 disabled:opacity-30 text-lg leading-none">×</button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setLignes((prev) => [...prev, { produit: "", quantite: 1, prixUnitaire: 0 }])}
              className="mt-2 text-sm text-green-600 hover:underline">+ Ajouter une ligne</button>
            <p className="text-right text-sm font-semibold text-slate-700 mt-2">Total: {formatNumber(Math.round(totalLignes))} FCFA</p>
          </div>

          <FormField label="Montant versé (FCFA)" name="montantPaye" type="number" placeholder="0" defaultValue={0} />
          <FormField label="Notes" name="notes" placeholder="Remarques..." />

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalType(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium">Annuler</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium disabled:opacity-60">{loading ? "..." : "Créer la vente"}</button>
          </div>
        </form>
      </Modal>

      {/* Modal Client */}
      <Modal title="Nouveau client" open={modalType === "client"} onClose={() => setModalType(null)}>
        <form onSubmit={handleClient} className="space-y-4">
          <FormField label="Nom" name="nom" required placeholder="Nom du client" />
          <FormField label="Téléphone" name="telephone" placeholder="+226 XX XX XX XX" />
          <FormField label="Email" name="email" type="email" placeholder="client@exemple.com" />
          <FormField label="Adresse" name="adresse" placeholder="Adresse" />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalType(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium">Annuler</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium disabled:opacity-60">{loading ? "..." : "Ajouter"}</button>
          </div>
        </form>
      </Modal>

      {/* Modal Paiement */}
      <Modal title="Enregistrer un paiement" open={modalType === "paiement"} onClose={() => { setModalType(null); setSelectedVente(null); }}>
        {selectedVente && (
          <form onSubmit={handlePaiement} className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-600">Client: <strong>{selectedVente.client.nom}</strong></p>
              <p className="text-sm text-slate-600">Total: <strong>{formatNumber(Math.round(selectedVente.total))} FCFA</strong></p>
              <p className="text-sm text-slate-600">Déjà payé: <strong>{formatNumber(Math.round(selectedVente.montantPaye))} FCFA</strong></p>
              <p className="text-sm text-red-600 font-semibold">Reste: {formatNumber(Math.round(selectedVente.total - selectedVente.montantPaye))} FCFA</p>
            </div>
            <FormField label="Nouveau montant total payé (FCFA)" name="montantPaye" type="number" required defaultValue={selectedVente.montantPaye} />
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => { setModalType(null); setSelectedVente(null); }} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium">Annuler</button>
              <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium disabled:opacity-60">{loading ? "..." : "Enregistrer"}</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
