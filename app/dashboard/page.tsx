"use client";

import { useEffect, useState } from "react";
import api from "../lib/axios";
import { useAuth } from "../context/AuthContext";
import { DashboardData, ResponseDTO } from "../types/types";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-gray-800">
      <div className="max-w-6xl mx-auto">
        {/* ENCABEZADO */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight">
              Hola,{" "}
              <span className="text-blue-600">{user?.nombre || "Usuario"}</span>{" "}
              👋
            </h1>
            <p className="text-gray-500 font-medium">
              Este es tu estado financiero actual.
            </p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            {/* <button
              onClick={() => router.push("/gastos")}
              className="flex-1 md:flex-none bg-gray-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-800 transition shadow-lg shadow-gray-200"
            >
              + GASTO
            </button> */}
            <button
              onClick={logout}
              className="bg-white text-red-500 border border-red-100 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-red-50 transition"
            >
              SALIR
            </button>
          </div>
        </div>

        {/* TARJETAS PRINCIPALES */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card
            title="Patrimonio Neto"
            value={data?.patrimonioNeto}
            color="text-blue-600"
          />
          <div
            onClick={() => router.push("/ahorros")}
            className="cursor-pointer"
          >
            <Card
              title="Ahorros Totales"
              value={data?.totalAhorrado}
              color="text-green-600"
            />
          </div>
          <div
            onClick={() => router.push("/deudas")}
            className="cursor-pointer"
          >
            <Card
              title="Deudas Pendientes"
              value={data?.totalDeuda}
              color="text-red-600"
            />
          </div>
          <div
            onClick={() => router.push("/gastos")}
            className="cursor-pointer"
          >
            <Card
              title="Gastos del Mes"
              value={data?.gastosMesActual}
              color="text-orange-600"
            />
          </div>
        </div>

        {/* TARJETA DE INTELIGENCIA: FONDO DE EMERGENCIA */}
        <div
          className={`${bgSalud} border border-transparent rounded-[2.5rem] p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 transition-all`}
        >
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm text-3xl">
              🛡️
            </div>
            <div>
              <h3 className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">
                Capacidad de Supervivencia
              </h3>
              <p className="text-gray-900 text-sm font-medium">
                Con tus ahorros actuales y tu nivel de gasto, podrías vivir:
              </p>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-5xl font-black italic tracking-tighter ${colorSalud}`}
                >
                  {mesesSupervivencia}
                </span>
                <span className="text-xl font-black text-gray-900 uppercase italic">
                  Meses
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white/50 backdrop-blur-sm px-6 py-4 rounded-3xl border border-white/50">
            <p className={`text-xs font-black uppercase mb-1 ${colorSalud}`}>
              Estado del Fondo
            </p>
            <p className="text-gray-800 font-bold">{mensajeSalud}</p>
            {Number(mesesSupervivencia) < 3 && (
              <p className="text-[9px] text-gray-500 font-medium mt-1 uppercase tracking-wider">
                Meta recomendada: 3.0 meses
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* COLUMNA IZQUIERDA: GASTOS (Más ancha) */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
              {/* <h2 className="text-xl font-black mb-8 italic uppercase tracking-tighter">
                Gastos por Categoría
              </h2> */}
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-black italic uppercase tracking-tighter">
                  Gastos por Categoría
                </h2>
                <button
                  onClick={() => router.push("/categorias")}
                  className="text-[10px] font-black bg-gray-100 text-gray-500 px-3 py-1.5 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors uppercase tracking-widest"
                >
                  Configurar
                </button>
              </div>
              <div className="space-y-6">
                {data?.gastosPorCategoria &&
                data.gastosPorCategoria.length > 0 ? (
                  data.gastosPorCategoria.map((item, index) => {
                    const valorNumerico = Number(item.valor) || 0;
                    const porcentaje =
                      totalGeneralGastos > 0
                        ? (valorNumerico / totalGeneralGastos) * 100
                        : 0;

                    let colorBarra = "bg-blue-500";
                    if (porcentaje > 30) colorBarra = "bg-red-500";
                    else if (porcentaje > 15) colorBarra = "bg-orange-400";

                    return (
                      <div
                        key={index}
                        className="group cursor-pointer"
                        onClick={() => irADetalle(item.nombre)}
                      >
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-sm font-black text-gray-700 uppercase tracking-wider">
                            {item.nombre}{" "}
                            <span className="text-gray-300 ml-2">
                              {porcentaje.toFixed(0)}%
                            </span>
                          </span>
                          <span className="font-bold text-gray-900">
                            ${valorNumerico.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-gray-50 h-3 rounded-full overflow-hidden">
                          <div
                            className={`${colorBarra} h-full rounded-full transition-all duration-1000`}
                            style={{ width: `${porcentaje}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-400 italic text-center py-10">
                    Sin gastos este mes.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: SALUD FINANCIERA (Comparativa) */}
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
              <h2 className="text-xl font-black mb-2 italic uppercase tracking-tighter">
                Balance
              </h2>
              <p className="text-xs font-bold text-gray-400 mb-8 uppercase">
                Ahorro vs Deuda
              </p>

              <div className="space-y-8">
                <div className="relative pt-4">
                  <div className="flex justify-between text-[10px] font-black uppercase mb-3">
                    <span className="text-red-500">
                      Deuda (${deuda.toLocaleString()})
                    </span>
                    <span className="text-green-600">
                      Ahorro (${ahorro.toLocaleString()})
                    </span>
                  </div>
                  <div className="w-full bg-red-100 h-6 rounded-2xl overflow-hidden flex">
                    <div
                      className="bg-green-500 h-full transition-all duration-1000"
                      style={{ width: `${ratioSalud}%` }}
                    />
                  </div>
                  <p className="text-center text-[10px] font-black text-gray-400 mt-4 uppercase">
                    {ratioSalud > 50
                      ? "¡Vas por buen camino!"
                      : "Atención a las deudas"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <button
                    onClick={() => router.push("/ahorros")}
                    className="bg-green-50 text-green-700 p-4 rounded-2xl text-center hover:bg-green-100 transition"
                  >
                    <p className="text-[10px] font-black uppercase">Metas</p>
                    <p className="text-lg font-black">
                      {(data?.totalAhorrado || 0) > 0 ? "Ver" : "Crear"}
                    </p>
                  </button>
                  <button
                    onClick={() => router.push("/deudas")}
                    className="bg-red-50 text-red-700 p-4 rounded-2xl text-center hover:bg-red-100 transition"
                  >
                    <p className="text-[10px] font-black uppercase">Deudas</p>
                    <p className="text-lg font-black">Gestionar</p>
                  </button>
                </div>
              </div>
            </div>
            {/* SECCIÓN PRÓXIMOS PAGOS */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black italic uppercase tracking-tighter">
                  Próximos Pagos
                </h2>
                <span className="bg-orange-100 text-orange-600 text-[10px] font-black px-2 py-1 rounded-lg uppercase">
                  Urgente
                </span>
              </div>

              <div className="space-y-4">
                {proximasDeudas.length > 0 ? (
                  proximasDeudas.map((deuda) => {
                    const hoy = new Date().getDate();
                    const faltanDias = deuda.dueDateDay - hoy;
                    const esVencida = faltanDias < 0;

                    return (
                      <div
                        key={deuda.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-gray-200 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center font-black ${esVencida ? "bg-red-100 text-red-600" : "bg-gray-900 text-white"}`}
                          >
                            <span className="text-[8px] leading-none uppercase">
                              {esVencida ? "PASÓ" : "DÍA"}
                            </span>
                            <span className="text-lg leading-none">
                              {deuda.dueDateDay}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-black text-gray-800 leading-none mb-1">
                              {deuda.name}
                            </p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                              {esVencida
                                ? "Venció hace poco"
                                : `En ${faltanDias} días`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-gray-900">
                            ${deuda.monthlyPayment.toLocaleString()}
                          </p>
                          <button
                            onClick={() => router.push("/deudas")}
                            className="text-[9px] font-black text-blue-600 uppercase hover:underline"
                          >
                            PAGAR
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-300 font-bold italic text-sm">
                      Todo al día por ahora ✨
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({
  title,
  value,
  color,
}: {
  title: string;
  value?: number;
  color: string;
}) {
  return (
    <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-md transition-all group">
      <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-3 group-hover:text-blue-500 transition-colors">
        {title}
      </h3>
      <p className={`text-3xl font-black ${color} tracking-tighter`}>
        $
        {value?.toLocaleString("es-MX", { minimumFractionDigits: 2 }) || "0.00"}
      </p>
    </div>
  );
}
