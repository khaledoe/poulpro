"use client";

import { useState } from "react";
import { Plus, Wheat, Package, ShoppingBag, AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { FormField, SelectField } from "@/components/ui/FormField";
import toast from "react-hot-toast";
import { formatDate, formatNumber } from "@/lib/utils";

interface Aliment { id: string; nom: string; unite: string; stockActuel: number; seuilAlerte: number; }
interface Troupeau { id: string; nom: string; }
interface Achat { id: string; date: string | Date; quantite: number; prixUnitaire: number; fournisseur: string | null; aliment: { id: string; nom: string; unite: string }; }
interface Conso { id: string; date: string | Date; quantite: number; notes: string | null; aliment: { id: string; nom: string; unite: string }; troupeau: { id: string; nom: string }; }

type Tab = "stocks" | "achats" | "consommations";

export function AlimentationPage({ aliments: init, achats: initAchats, consommations: initConsos, troupeaux }: {
  aliments: Aliment[]; achats: Achat[]; consommations: Conso[]; troupeaux: Troupeau[];
}) {
  const [aliments, setAliments] = useState(init);
  const [achats, setAchats] = useState(initAchats);
  const [consos, setConsos] = useState(initConsos);
  const [tab, setTab] = useState<Tab>("stocks");
  const [modalType, setModalType] = useState<"aliment" | "achat" | "conso" | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      if (modalType === "aliment") {
        const data = { nom: fd.get("nom"), unite: fd.get("unite"), seuilAlerte: fd.get("seuilAlerte") };
        const res = await fetch("/api/aliments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error);
        setAliments((a) => [...a, result].sort((x, y) => x.nom.localeCompare(y.nom)));
        toast.success("Aliment ajouté");
      } else if (modalType === "achat") {
        const data = { date: fd.get("date"), alimentId: fd.get("alimentId"), quantite: fd.get("quantite"), prixUnitaire: fd.get("prixUnitaire"), fournisseur: fd.get("fournisseur") };
        const res = await fetch("/api/aliments/achats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error);
        setAchats((a) => [result, ...a]);
        setAliments((a) => a.map((x) => x.id === result.alimentId ? { ...x, stockActuel: x.stockActuel + Number(fd.get("quantite")) } : x));
        toast.success("Achat enregistré");
      } else if (modalType === "conso") {
        const data = { date: fd.get("date"), alimentId: fd.get("alimentId"), troupeauId: fd.get("troupeauId"), quantite: fd.get("quantite"), notes: fd.get("notes") };
        const res = await fetch("/api/aliments/consommations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error);
        setConsos((c) => [result, ...c]);
        setAliments((a) => a.map((x) => x.id === result.alimentId ? { ...x, stockActuel: Math.max(0, x.stockActuel - Number(fd.get("quantite"))) } : x));
        toast.success("Consommation enregistrée");
      }
      setModalType(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally { setLoading(false); }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "stocks", label: "Stocks" },
    { key: "achats", label: "Achats" },
    { key: "consommations", label: "Consommations" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Alimentation</h2>
          <p className="text-slate-500 text-sm">{aliments.filter((a) => a.stockActuel <= a.seuilAlerte).length} aliment(s) en alerte</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setModalType("achat")} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl text-sm font-medium">
            <ShoppingBag size={14} /> Achat
          </button>
          <button onClick={() => setModalType("conso")} className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-xl text-sm font-medium">
            <Wheat size={14} /> Consommation
          </button>
          <button onClick={() => setModalType("aliment")} className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-xl text-sm font-medium">
            <Plus size={14} /> Aliment
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Stocks */}
      {tab === "stocks" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {aliments.map((a) => {
            const alerte = a.stockActuel <= a.seuilAlerte;
            return (
              <div key={a.id} className={`bg-white rounded-2xl p-4 shadow-sm border ${alerte ? "border-orange-200" : "border-slate-100"}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Package size={16} className={alerte ? "text-orange-500" : "text-green-600"} />
                    <span className="font-semibold text-slate-800">{a.nom}</span>
                  </div>
                  {alerte && <AlertTriangle size={14} className="text-orange-500" />}
                </div>
                <p className="text-2xl font-bold text-slate-800">{formatNumber(Math.round(a.stockActuel))} <span className="text-sm font-normal text-slate-400">{a.unite}</span></p>
                <p className="text-xs text-slate-400 mt-1">Seuil alerte: {formatNumber(a.seuilAlerte)} {a.unite}</p>
                {alerte && <p className="text-xs text-orange-600 font-medium mt-1">Stock en dessous du seuil !</p>}
              </div>
            );
          })}
          {aliments.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-400">
              <Package size={40} className="mx-auto mb-3 opacity-30" />
              <p>Aucun aliment. Commencez par en ajouter un.</p>
            </div>
          )}
        </div>
      )}

      {/* Achats */}
      {tab === "achats" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Aliment</th>
                  <th className="px-4 py-3 text-right">Quantité</th>
                  <th className="px-4 py-3 text-right">Prix unitaire</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-left">Fournisseur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {achats.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-600">{formatDate(a.date)}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{a.aliment.nom}</td>
                    <td className="px-4 py-3 text-right">{formatNumber(a.quantite)} {a.aliment.unite}</td>
                    <td className="px-4 py-3 text-right">{formatNumber(a.prixUnitaire)} FCFA</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatNumber(Math.round(a.quantite * a.prixUnitaire))} FCFA</td>
                    <td className="px-4 py-3 text-slate-400">{a.fournisseur ?? "—"}</td>
                  </tr>
                ))}
                {achats.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-slate-400">Aucun achat enregistré</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Consommations */}
      {tab === "consommations" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Aliment</th>
                  <th className="px-4 py-3 text-left">Troupeau</th>
                  <th className="px-4 py-3 text-right">Quantité</th>
                  <th className="px-4 py-3 text-left">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {consos.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-600">{formatDate(c.date)}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{c.aliment.nom}</td>
                    <td className="px-4 py-3 text-slate-600">{c.troupeau.nom}</td>
                    <td className="px-4 py-3 text-right">{formatNumber(c.quantite)} {c.aliment.unite}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{c.notes ?? "—"}</td>
                  </tr>
                ))}
                {consos.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-slate-400">Aucune consommation enregistrée</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <Modal title="Nouvel aliment" open={modalType === "aliment"} onClose={() => setModalType(null)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Nom de l'aliment" name="nom" required placeholder="Maïs, Tourteau, etc." />
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Unité" name="unite" placeholder="kg" defaultValue="kg" />
            <FormField label="Seuil d'alerte" name="seuilAlerte" type="number" placeholder="100" defaultValue={100} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalType(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium">Annuler</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium disabled:opacity-60">{loading ? "..." : "Ajouter"}</button>
          </div>
        </form>
      </Modal>

      <Modal title="Enregistrer un achat" open={modalType === "achat"} onClose={() => setModalType(null)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Date" name="date" type="date" required defaultValue={new Date().toISOString().split("T")[0]} />
          <SelectField label="Aliment" name="alimentId" required options={aliments.map((a) => ({ value: a.id, label: a.nom }))} />
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Quantité" name="quantite" type="number" required placeholder="0" />
            <FormField label="Prix unitaire (FCFA)" name="prixUnitaire" type="number" required placeholder="0" />
          </div>
          <FormField label="Fournisseur" name="fournisseur" placeholder="Nom du fournisseur" />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalType(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium">Annuler</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium disabled:opacity-60">{loading ? "..." : "Enregistrer"}</button>
          </div>
        </form>
      </Modal>

      <Modal title="Enregistrer une consommation" open={modalType === "conso"} onClose={() => setModalType(null)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Date" name="date" type="date" required defaultValue={new Date().toISOString().split("T")[0]} />
          <SelectField label="Aliment" name="alimentId" required options={aliments.map((a) => ({ value: a.id, label: `${a.nom} (${formatNumber(Math.round(a.stockActuel))} ${a.unite})` }))} />
          <SelectField label="Troupeau" name="troupeauId" required options={troupeaux.map((t) => ({ value: t.id, label: t.nom }))} />
          <FormField label="Quantité distribuée" name="quantite" type="number" required placeholder="0" />
          <FormField label="Notes" name="notes" placeholder="Remarques..." />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalType(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium">Annuler</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-medium disabled:opacity-60">{loading ? "..." : "Enregistrer"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
