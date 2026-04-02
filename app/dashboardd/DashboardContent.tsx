"use client";
import type { Metadata } from "next";
// import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
// import React from "react";
// import MonthlyTarget from "@/components/ecommerce/MonthlyTarget";
import MonthlySalesChart from "@/components/ecommerce/MonthlySalesChart";
// import StatisticsChart from "@/components/ecommerce/StatisticsChart";
// import RecentOrders from "@/components/ecommerce/RecentOrders";
// import DemographicCard from "@/components/ecommerce/DemographicCard";
import { CardMetrics } from "@/components/dashboard/CardMetrics";

//
import { useEffect, useState } from "react";
import api from "../lib/axios";
import { useAuth } from "../context/AuthContext";
import { DashboardData, ResponseDTO } from "../types/types";
import { useRouter } from "next/navigation";

export const metadata: Metadata = {
  title:
    "Next.js E-commerce Dashboard | TailAdmin - Next.js Dashboard Template",
  description: "This is Next.js Home for TailAdmin Dashboard Template",
};

export default function DashboardContent() {
  const { logout, user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!user?.id) return;

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const response = await api.get<ResponseDTO<DashboardData>>(
          `/dashboard/resumen/${user.id}`,
        );
        setData(response.data.data);
      } catch (error) {
        console.error("Error al cargar el dashboard", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [user?.id]);

  const irADetalle = (catNombre: string) => {
    router.push(`/gastos?categoria=${catNombre.toLowerCase()}`);
  };

  const totalGeneralGastos =
    data?.gastosPorCategoria?.reduce(
      (acc, item) => acc + (Number(item.valor) || 0),
      0,
    ) || 0;

  // --- CÁLCULOS DE SALUD FINANCIERA ---
  const ahorro = data?.totalAhorrado || 0;
  const deuda = data?.totalDeuda || 0;
  const ratioSalud =
    ahorro > 0 || deuda > 0 ? (ahorro / (ahorro + deuda)) * 100 : 50;

  // 1. Agrega este estado en tu DashboardPage
  const [proximasDeudas, setProximasDeudas] = useState<any[]>([]);

  // 2. En el useEffect donde cargas el Dashboard, añade la carga de deudas:
  useEffect(() => {
    const fetchProximosPagos = async () => {
      try {
        const res = await api.get<ResponseDTO<any[]>>(
          `/deudas/usuario/${user?.id}`,
        );
        const deudas = res.data.data || [];

        // Obtener el día actual
        const hoy = new Date().getDate();

        // Ordenar: primero las que vencen pronto este mes, luego las del próximo
        const ordenadas = deudas
          .filter((d) => d.balance > 0) // Solo deudas pendientes
          .sort((a, b) => {
            const diaA = a.dueDateDay < hoy ? a.dueDateDay + 31 : a.dueDateDay;
            const diaB = b.dueDateDay < hoy ? b.dueDateDay + 31 : b.dueDateDay;
            return diaA - diaB;
          });

        setProximasDeudas(ordenadas.slice(0, 10)); // Solo las 10 más cercanas
      } catch (e) {
        console.error(e);
      }
    };

    if (user?.id) fetchProximosPagos();
  }, [user?.id]);

  // --- CÁLCULO DE SUPERVIVENCIA ---
  const ahorrosTotales = data?.totalAhorrado || 0;
  const gastosMensuales = data?.gastosMesActual || 0;

  // Calculamos cuántos meses podrías vivir sin ingresos
  // Usamos Math.max(gastosMensuales, 1) para evitar división por cero
  const mesesSupervivencia = (
    ahorrosTotales / Math.max(gastosMensuales, 1)
  ).toFixed(1);

  // Definimos un estado de salud basado en los meses (regla de oro: 3 a 6 meses es ideal)
  let mensajeSalud = "Necesitas ahorrar más";
  let colorSalud = "text-red-500";
  let bgSalud = "bg-red-50";

  if (Number(mesesSupervivencia) >= 6) {
    mensajeSalud = "¡Excelente libertad!";
    colorSalud = "text-green-600";
    bgSalud = "bg-green-50";
  } else if (Number(mesesSupervivencia) >= 3) {
    mensajeSalud = "Estás protegido";
    colorSalud = "text-blue-600";
    bgSalud = "bg-blue-50";
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-bold text-gray-400 italic">
            Cargando tu resumen...
          </p>
        </div>
      </div>
    );

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 ">
        <CardMetrics />

        <MonthlySalesChart />
      </div>

      {/* <div className="col-span-12 xl:col-span-5">
        <MonthlyTarget />
      </div>

      <div className="col-span-12">
        <StatisticsChart />
      </div>

      <div className="col-span-12 xl:col-span-5">
        <DemographicCard />
      </div>

      <div className="col-span-12 xl:col-span-7">
        <RecentOrders />
      </div> */}
    </div>
  );
}
