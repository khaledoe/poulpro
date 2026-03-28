import { prisma } from "@/lib/prisma";
import { formatNumber } from "@/lib/utils";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { subDays, format, startOfDay } from "date-fns";
import { Egg, Bird, AlertTriangle, TrendingUp, Building2, DollarSign } from "lucide-react";

export default async function DashboardPage() {
  const today = startOfDay(new Date());
  const last30 = subDays(today, 30);
  const last7 = subDays(today, 7);

  const [
    totalPoules,
    poulaillerCount,
    productionToday,
    productionWeek,
    mortalitesMois,
    alimentsAlerte,
    ventesImpayees,
    productionData,
    mortaliteData,
  ] = await Promise.all([
    prisma.troupeau.aggregate({ where: { actif: true }, _sum: { nombreActuel: true } }),
    prisma.poulailler.count({ where: { actif: true } }),
    prisma.production.aggregate({
      where: { date: { gte: today } },
      _sum: { oeufsTotaux: true },
    }),
    prisma.production.aggregate({
      where: { date: { gte: last7 } },
      _sum: { oeufsTotaux: true },
    }),
    prisma.mortalite.aggregate({
      where: { date: { gte: last30 } },
      _sum: { nombre: true },
    }),
    prisma.aliment.count({
      where: { stockActuel: { lte: prisma.aliment.fields.seuilAlerte } },
    }).catch(() => 0),
    prisma.vente.aggregate({
      where: { statut: { in: ["EN_ATTENTE", "PARTIELLE"] } },
      _sum: { total: true },
    }),
    // Last 14 days production for chart
    prisma.production.groupBy({
      by: ["date"],
      where: { date: { gte: subDays(today, 14) } },
      _sum: { oeufsTotaux: true },
      orderBy: { date: "asc" },
    }),
    // Last 14 days mortalite
    prisma.mortalite.groupBy({
      by: ["date"],
      where: { date: { gte: subDays(today, 14) } },
      _sum: { nombre: true },
      orderBy: { date: "asc" },
    }),
  ]);

  const statsCards = [
    {
      label: "Poules actives",
      value: formatNumber(totalPoules._sum.nombreActuel ?? 0),
      icon: Bird,
      color: "bg-blue-500",
      bg: "bg-blue-50",
    },
    {
      label: "Poulaillers",
      value: formatNumber(poulaillerCount),
      icon: Building2,
      color: "bg-emerald-500",
      bg: "bg-emerald-50",
    },
    {
      label: "Œufs aujourd'hui",
      value: formatNumber(productionToday._sum.oeufsTotaux ?? 0),
      icon: Egg,
      color: "bg-yellow-500",
      bg: "bg-yellow-50",
    },
    {
      label: "Œufs (7 jours)",
      value: formatNumber(productionWeek._sum.oeufsTotaux ?? 0),
      icon: TrendingUp,
      color: "bg-green-500",
      bg: "bg-green-50",
    },
    {
      label: "Mortalités (30j)",
      value: formatNumber(mortalitesMois._sum.nombre ?? 0),
      icon: AlertTriangle,
      color: "bg-red-500",
      bg: "bg-red-50",
    },
    {
      label: "Impayés",
      value: formatNumber(Math.round(ventesImpayees._sum.total ?? 0)) + " FCFA",
      icon: DollarSign,
      color: "bg-orange-500",
      bg: "bg-orange-50",
    },
  ];

  // Build chart data for last 14 days
  const chartDays = Array.from({ length: 14 }, (_, i) => {
    const d = subDays(today, 13 - i);
    return format(d, "yyyy-MM-dd");
  });

  const prodMap = new Map(productionData.map((p) => [format(new Date(p.date), "yyyy-MM-dd"), p._sum.oeufsTotaux ?? 0]));
  const mortMap = new Map(mortaliteData.map((m) => [format(new Date(m.date), "yyyy-MM-dd"), m._sum.nombre ?? 0]));

  const chartData = chartDays.map((d) => ({
    date: format(new Date(d), "dd/MM"),
    oeufs: prodMap.get(d) ?? 0,
    mortalites: mortMap.get(d) ?? 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Tableau de bord</h2>
        <p className="text-slate-500 text-sm mt-1">Vue d'ensemble de votre exploitation</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statsCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium">{card.label}</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{card.value}</p>
                </div>
                <div className={`${card.bg} p-2 rounded-xl`}>
                  <Icon size={20} className={card.color.replace("bg-", "text-")} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <DashboardCharts data={chartData} />

      {alimentsAlerte > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle className="text-orange-500 shrink-0" size={20} />
          <p className="text-orange-800 text-sm">
            <strong>{alimentsAlerte} aliment(s)</strong> ont un stock en dessous du seuil d'alerte.
          </p>
        </div>
      )}
    </div>
  );
}
