"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/axios";
import { useAuth } from "../../context/AuthContext";
import { Gasto, ResponseDTO } from "../../types/types";

export default function BuscarGastoPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [fechaBusqueda, setFechaBusqueda] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(false);
  const [buscado, setBuscado] = useState(false);

  const handleBuscar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    // Extraer dia, mes y año del input date (YYYY-MM-DD)
    const [anio, mes, dia] = fechaBusqueda.split("-").map(Number);

    try {
      setLoading(true);
      setBuscado(true);
      const url = `/gastos/usuario/${user.id}/mes?mes=${mes}&anio=${anio}`;
      const response = await api.get<ResponseDTO<Gasto[]>>(url);
      setGastos(response.data.data);
    } catch (error) {
      console.error("Error al buscar gastos por fecha", error);
    } finally {
      setLoading(false);
    }
  };

  const totalDia = gastos.reduce((acc, g) => acc + g.amount, 0);

  return (
    <div className="mmin-h-screen bg-gray-50 p-4 md:p-8 text-gray-800">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-6 flex items-center gap-1"
        >
          ← Regresar
        </button>

        <h1 className="text-3xl font-black text-gray-900 mb-8">
          Buscador por Mes
        </h1>

        {/* Panel de Búsqueda */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8">
          <form
            onSubmit={handleBuscar}
            className="flex flex-col md:flex-row items-end gap-4"
          >
            <div className="flex-1 w-full">
              {/* <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                Selecciona el día
              </label>
              <input
                type="date"
                value={fechaBusqueda}
                onChange={(e) => setFechaBusqueda(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition"
              /> */}

              <div className="max-w-sm">
                <label
                  htmlFor="fecha"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Selecciona Mes y Año
                </label>
                <input
                  type="month"
                  id="fecha"
                  name="fecha"
                  value={fechaBusqueda}
                  onChange={(e) => setFechaBusqueda(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-600"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition active:scale-95 disabled:bg-gray-300"
            >
              {loading ? "Buscando..." : "Consultar Gastos"}
            </button>
          </form>
        </div>

        {/* Resultados */}
        {buscado && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-700">
                Resultados para el {fechaBusqueda}
              </h2>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 font-bold uppercase">
                  Total del mes
                </p>
                <p className="text-2xl font-black text-blue-600">
                  $
                  {totalDia.toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="p-5 text-xs font-bold text-gray-400 uppercase">
                      Concepto
                    </th>
                    <th className="p-5 text-xs font-bold text-gray-400 uppercase">
                      Categoría
                    </th>
                    <th className="p-5 text-xs font-bold text-gray-400 uppercase text-right">
                      Monto
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {gastos.length > 0 ? (
                    gastos.map((g) => (
                      <tr
                        key={g.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="p-5 font-semibold text-gray-900">
                          {g.description}
                          {g.relatedDebt && (
                            <span className="ml-2 text-[8px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-md uppercase font-black">
                              💳 {g.relatedDebt.name}
                            </span>
                          )}
                        </td>
                        <td className="p-5">
                          <span className="px-3 py-1 bg-gray-100 rounded-full text-gray-600 text-xs capitalize">
                            {g.category.name}
                          </span>
                        </td>
                        <td className="p-5 text-right font-black text-gray-900">
                          $
                          {g.amount.toLocaleString("es-MX", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={3}
                        className="p-16 text-center text-gray-400 italic"
                      >
                        No se encontraron gastos para esta fecha.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
