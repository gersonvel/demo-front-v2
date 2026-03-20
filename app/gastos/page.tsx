"use client";

import { useEffect, useState, Suspense, ChangeEvent, FormEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "../lib/axios";
import { useAuth } from "../context/AuthContext";
import { Gasto, ResponseDTO, Category, Deuda } from "../types/types";
import Input from "@/components/form/input/InputField";
import DatePicker from "@/components/form/date-picker";

export default function GastosPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-gray-500 font-medium">
          Cargando aplicación...
        </div>
      }
    >
      <GastosContent />
    </Suspense>
  );
}

function GastosContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoriaFiltrada = searchParams.get("categoria");

  // --- ESTADOS ---
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpenDelete, setIsModalOpenDelete] = useState(false);
  const [categorias, setCategorias] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [deudas, setDeudas] = useState<Deuda[]>([]); // Para el selector de tarjetas
  // Cambiado de Gasto[] a Gasto | null para manejar un solo objeto
  const [gastoSeleccionado, setGastoSeleccionado] = useState<Gasto | null>(
    null,
  );

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    categoryId: "",
    deudaId: "",
  });

  // 1. Cargar Gastos
  const fetchGastos = async () => {
    if (!user?.id) return;
    const hoy = new Date();
    const mes = hoy.getMonth() + 1;
    const anio = hoy.getFullYear();

    try {
      setLoading(true);
      let url = `/gastos/usuario/${user.id}/mes?mes=${mes}&anio=${anio}`;
      if (categoriaFiltrada) url += `&categoria=${categoriaFiltrada}`;
      const response = await api.get<ResponseDTO<Gasto[]>>(url);
      setGastos(response.data.data);
    } catch (error) {
      console.error("Error al obtener gastos:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategorias = async () => {
    if (!user?.id) return;
    try {
      const res = await api.get<ResponseDTO<Category[]>>(
        `/categorias/usuario/${user.id}`,
      );
      setCategorias(res.data.data);
    } catch (error) {
      console.error("Error al cargar categorías:", error);
    }
  };

  useEffect(() => {
    fetchGastos();
  }, [user?.id, categoriaFiltrada]);

  //   useEffect(() => {
  //     if (isModalOpen) fetchCategorias();
  //   }, [isModalOpen]);

  // Carga las deudas al abrir el modal
  useEffect(() => {
    if (isModalOpen) {
      fetchCategorias();
      // Cargar deudas para el selector de "Método de Pago"
      api
        .get<ResponseDTO<Deuda[]>>(`/deudas/usuario/${user?.id}`)
        .then((res) => setDeudas(res.data.data || []));
    }
  }, [isModalOpen]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Optimización: Buscamos el gasto en el array local en lugar de hacer otra petición
  const handleOpenDeleteModal = (gastoId: number) => {
    const gasto = gastos.find((g) => g.id === gastoId);
    if (gasto) {
      setGastoSeleccionado(gasto);
      setIsModalOpenDelete(true);
    }
  };

  const handleDelete = async () => {
    if (!user?.id || !gastoSeleccionado) return;

    setSubmitting(true);
    try {
      await api.delete(`/gastos/${gastoSeleccionado.id}/usuario/${user.id}`);

      // Actualizamos la UI: Cerramos modal y refrescamos lista
      setIsModalOpenDelete(false);
      setGastoSeleccionado(null);
      fetchGastos();
    } catch (error) {
      console.error("Error al borrar:", error);
      alert("No se pudo eliminar el registro.");
    } finally {
      setSubmitting(false);
    }
  };

  //   const handleSubmit = async (e: FormEvent) => {
  //     e.preventDefault();
  //     if (!user?.id) return;
  //     setSubmitting(true);

  //     const payload = {
  //       description: formData.description,
  //       amount: Number(formData.amount),
  //       date: formData.date,
  //       category: { id: Number(formData.categoryId) },
  //     };

  //     try {
  //       await api.post(`/gastos/usuario/${user.id}`, payload);
  //       setIsModalOpen(false);
  //       setFormData({
  //         description: "",
  //         amount: "",
  //         date: new Date().toISOString().split("T")[0],
  //         categoryId: "",
  //       });
  //       fetchGastos();
  //     } catch (error) {
  //       console.error("Error al guardar:", error);
  //       alert("No se pudo registrar el gasto.");
  //     } finally {
  //       setSubmitting(false);
  //     }
  //   };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setSubmitting(true);

    const payload = {
      description: formData.description,
      amount: Number(formData.amount),
      date: formData.date,
      category: { id: Number(formData.categoryId) },
      // Si seleccionó una deuda, la enviamos
      relatedDebt: formData.deudaId ? { id: Number(formData.deudaId) } : null,
    };

    try {
      await api.post(`/gastos/usuario/${user.id}`, payload);
      setIsModalOpen(false);
      // Limpiar formulario...
      fetchGastos();
      setFormData({
        description: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        categoryId: "",
        deudaId: "",
      });
    } catch (error) {
      alert("Error al guardar");
    } finally {
      setSubmitting(false);
    }
  };

  const totalListado = gastos.reduce((acc, g) => acc + g.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-gray-800">
      <div className="max-w-5xl mx-auto">
        {/* Cabecera */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <button
              onClick={() => router.push("/dashboard")}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 mb-2"
            >
              ← Volver al Dashboard
            </button>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Mis Gastos
              {categoriaFiltrada && (
                <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full capitalize">
                  {categoriaFiltrada}
                </span>
              )}
            </h1>
            <button
              onClick={() => router.push("/gastos/allGastos")}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 mb-2"
            >
              Ver todos los gasto
            </button>

            <button
              onClick={() => router.push("/gastos/buscar")}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 mb-2"
            >
              Buscar por fecha en específico
            </button>
          </div>

          {/* Botón Flotante */}
          <div className="flex justify-end">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold shadow-xl transition-all active:scale-95"
            >
              + Registrar Gasto
            </button>
          </div>
        </div>

        <div className="flex justify-end mb-4">
          <div className="bg-white px-10 py-6 rounded-[2.5rem] shadow-sm border-l-[12px] border-red-500">
            <p className="text-gray-400 text-xs font-black uppercase tracking-widest">
              Total del mes
            </p>
            <p className="text-4xl font-black text-gray-900">
              $
              {totalListado.toLocaleString("es-MX", {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <th className="p-5">Fecha</th>
                  <th className="p-5">Concepto</th>
                  <th className="p-5 text-center">Categoría</th>
                  <th className="p-5 text-right">Monto</th>
                  <th className="p-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-16 text-center text-gray-400">
                      Cargando...
                    </td>
                  </tr>
                ) : gastos.length > 0 ? (
                  gastos.map((gasto) => (
                    <tr
                      key={gasto.id}
                      className="group hover:bg-blue-50/40 transition-colors"
                    >
                      <td className="p-5 text-sm text-gray-500 italic">
                        {new Date(gasto.date).toLocaleDateString("es-MX", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </td>
                      <td className="p-5 font-semibold text-gray-900">
                        {gasto.description}
                        {gasto.relatedDebt && (
                          <span className="ml-2 text-[8px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-md uppercase font-black">
                            💳 {gasto.relatedDebt.name}
                          </span>
                        )}
                      </td>
                      <td className="p-5 text-center">
                        <span className="px-3 py-1 bg-gray-100 rounded-full text-gray-600 text-xs capitalize">
                          {gasto.category.name}
                        </span>
                      </td>
                      <td className="p-5 text-right font-black text-gray-900">
                        $
                        {gasto.amount.toLocaleString("es-MX", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="p-5 text-right">
                        <button
                          onClick={() => handleOpenDeleteModal(gasto.id)}
                          className="text-red-400 hover:text-red-600 text-sm font-bold transition-colors"
                        >
                          Borrar
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-16 text-center text-gray-400 italic"
                    >
                      No hay registros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL PARA BORRAR GASTO */}
        {isModalOpenDelete && gastoSeleccionado && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
              <h2 className="text-2xl font-black text-gray-900 mb-2">
                ¿Eliminar gasto?
              </h2>
              <p className="text-gray-500 mb-6">
                Esta acción no se puede deshacer.
              </p>

              <div className="bg-red-50 p-4 rounded-2xl border border-red-100 mb-8">
                <p className="text-sm text-red-800">
                  <strong>Gasto:</strong> {gastoSeleccionado.description}
                </p>
                <p className="text-sm text-red-800">
                  <strong>Monto:</strong> ${gastoSeleccionado.amount}
                </p>
                <p className="text-xs text-red-400 mt-1 italic">
                  {gastoSeleccionado.date}
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setIsModalOpenDelete(false)}
                  className="flex-1 py-4 text-gray-400 font-bold hover:text-gray-600"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={submitting}
                  className="flex-1 py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition disabled:bg-gray-200"
                >
                  {submitting ? "Eliminando..." : "Eliminar"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL REGISTRO (Mismo que ya tenías) */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
              {/* ... Contenido de tu formulario ... */}
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-black text-gray-900">
                  Añadir Gasto
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 text-2xl"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <input
                  required
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none"
                  placeholder="Descripción"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    required
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none"
                    placeholder="Monto"
                  />
                  {/* <input
                    required
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none"
                  /> */}

                  <DatePicker
                    id="date-gasto"
                    placeholder="Fecha"
                    onChange={(dates, currentDateString) => {
                      // Usamos "as any" para saltarnos la validación estricta del evento
                      handleChange({
                        target: {
                          name: "date",
                          value: currentDateString,
                        },
                      } as React.ChangeEvent<HTMLInputElement>);
                    }}
                  />
                </div>
                <select
                  required
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none"
                >
                  <option value="">Categoría...</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>

                <select
                  name="deudaId"
                  value={formData.deudaId}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none border-2 border-blue-100"
                >
                  <option value="">💵 Efectivo / Débito</option>
                  <optgroup label="Tarjetas de Crédito">
                    {deudas.map((d) => (
                      <option key={d.id} value={d.id}>
                        💳 {d.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition"
                >
                  {submitting ? "Guardando..." : "Confirmar Gasto"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
