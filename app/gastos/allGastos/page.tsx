"use client";

import { useEffect, useState, Suspense, ChangeEvent, FormEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "../../lib/axios";
import { useAuth } from "../../context/AuthContext";
import { Gasto, ResponseDTO, Category } from "../../types/types";

// Interface para la respuesta paginada de Spring Data
interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export default function GastosPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-gray-500">Cargando...</div>
      }
    >
      <GastosContent />
    </Suspense>
  );
}

function GastosContent() {
  const { user } = useAuth();
  const router = useRouter();

  // --- ESTADOS ---
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpenDelete, setIsModalOpenDelete] = useState(false);
  const [categorias, setCategorias] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Paginación
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Gasto Específico (Seleccionado para ver/borrar)
  const [gastoSeleccionado, setGastoSeleccionado] = useState<Gasto | null>(
    null,
  );

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    categoryId: "",
  });

  // 1. Cargar Gastos Paginados (Todos los tiempos)
  const fetchGastosPaginados = async (pageNumber: number) => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const res = await api.get<ResponseDTO<PageResponse<Gasto>>>(
        `/gastos/usuario/${user.id}/paginado?page=${pageNumber}&size=10`,
      );

      const data = res.data.data;
      setGastos(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (error) {
      console.error("Error al cargar historial:", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Cargar un Gasto Específico (Detalle)
  const fetchGastoIndividual = async (id: number) => {
    if (!user?.id) return;
    try {
      const res = await api.get<ResponseDTO<Gasto>>(
        `/gastos/${id}/usuario/${user.id}`,
      );
      setGastoSeleccionado(res.data.data);
      setIsModalOpenDelete(true); // Abrimos el modal con la info cargada
    } catch (error) {
      alert("No se pudo obtener el detalle del gasto");
    }
  };

  useEffect(() => {
    fetchGastosPaginados(page);
  }, [user?.id, page]);

  // --- MANEJADORES ---
  const handleDelete = async () => {
    if (!user?.id || !gastoSeleccionado) return;
    setSubmitting(true);
    try {
      await api.delete(`/gastos/${gastoSeleccionado.id}/usuario/${user.id}`);
      setIsModalOpenDelete(false);
      setGastoSeleccionado(null);
      fetchGastosPaginados(page); // Recargar página actual
    } catch (error) {
      console.error("Error al borrar", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setSubmitting(true);
    try {
      await api.post(`/gastos/usuario/${user.id}`, {
        description: formData.description,
        amount: Number(formData.amount),
        date: formData.date,
        category: { id: Number(formData.categoryId) },
      });
      setIsModalOpen(false);
      setPage(0); // Volver a la primera página para ver el nuevo registro
      fetchGastosPaginados(0);
    } catch (error) {
      alert("Error al guardar");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-gray-800">
      <div className="max-w-5xl mx-auto">
        {/* CABECERA */}
        <div className="flex flex-col md:flex-row justify-between mb-8 items-end">
          <div>
            <button
              onClick={() => router.push("/dashboard")}
              className="text-blue-600 text-sm mb-2"
            >
              ← Dashboard
            </button>
            <h1 className="text-3xl font-black text-gray-900">
              Historial de Gastos
            </h1>
            <p className="text-gray-500 font-medium">
              Total de registros: {totalElements}
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg"
          >
            + Nuevo Gasto
          </button>
        </div>

        {/* TABLA PAGINADA */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-widest">
                <th className="p-5">Fecha</th>
                <th className="p-5">Descripción</th>
                <th className="p-5 text-right">Monto</th>
                <th className="p-5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-gray-400">
                    Cargando historial...
                  </td>
                </tr>
              ) : gastos.length > 0 ? (
                gastos.map((g) => (
                  <tr
                    key={g.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="p-5 text-sm font-medium text-gray-500">
                      {g.date}
                    </td>
                    <td className="p-5 font-bold text-gray-900">
                      {g.description}
                      {g.relatedDebt && (
                        <span className="ml-2 text-[8px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-md uppercase font-black">
                          💳 {g.relatedDebt.name}
                        </span>
                      )}
                      <span className="block text-[10px] text-blue-500 uppercase">
                        {g.category.name}
                      </span>
                    </td>
                    <td className="p-5 text-right font-black text-gray-900">
                      ${g.amount.toFixed(2)}
                    </td>
                    <td className="p-5 text-center">
                      <button
                        onClick={() => fetchGastoIndividual(g.id)}
                        className="text-gray-400 hover:text-red-500 font-bold text-sm transition-colors"
                      >
                        Ver / Borrar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="p-16 text-center text-gray-400 italic"
                  >
                    No se encontraron registros en el historial.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* PAGINACIÓN - Solo se muestra si hay registros */}
          {gastos.length > 0 && (
            <div className="p-5 border-t border-gray-50 flex items-center justify-between">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2 text-sm font-bold text-blue-600 disabled:text-gray-300 transition-colors"
              >
                Anterior
              </button>

              <div className="flex gap-2">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      page === i
                        ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                        : "text-gray-400 hover:bg-gray-100"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 text-sm font-bold text-blue-600 disabled:text-gray-300 transition-colors"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>

        {/* MODAL DETALLE / ELIMINAR */}
        {isModalOpenDelete && gastoSeleccionado && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-in zoom-in duration-200 text-black">
              <h2 className="text-xl font-black mb-4">Detalle del Gasto</h2>
              <div className="space-y-3 mb-8">
                <div className="flex justify-between border-b pb-2">
                  <span className=" text-sm">Concepto:</span>
                  <span className="font-bold">
                    {gastoSeleccionado.description}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className=" text-sm">Monto:</span>
                  <span className="font-bold text-blue-600">
                    ${gastoSeleccionado.amount}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className=" text-sm">Fecha:</span>
                  <span className="font-bold">{gastoSeleccionado.date}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className=" text-sm">Categoría:</span>
                  <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-bold uppercase">
                    {gastoSeleccionado.category.name}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsModalOpenDelete(false)}
                  className="flex-1 py-3 font-bold "
                >
                  Cerrar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={submitting}
                  className="flex-1 py-3 bg-red-500 text-white font-black rounded-xl hover:bg-red-600 transition"
                >
                  {submitting ? "..." : "Eliminar"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL REGISTRO (Mismo que ya tenías) */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in duration-200 text-black">
              {/* ... Contenido de tu formulario ... */}
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-black ">Añadir Gasto</h2>
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
                  <input
                    required
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none"
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
