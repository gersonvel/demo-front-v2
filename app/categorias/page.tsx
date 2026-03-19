"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import api from "../lib/axios";
import { useAuth } from "../context/AuthContext";
import { ResponseDTO } from "../types/types";

interface Categoria {
  id: number;
  name: string;
  icon: string;
  color: string;
}

export default function CategoriasPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    icon: "🛒",
    color: "#3b82f6",
  });

  const fetchCategorias = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const res = await api.get<ResponseDTO<Categoria[]>>(
        `/categorias/usuario/${user.id}`,
      );
      setCategorias(res.data.data || []);
    } catch (error) {
      console.error("Error cargando categorías", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategorias();
  }, [user?.id]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setSubmitting(true);
    try {
      if (editingId) {
        await api.post(`/categorias/${editingId}/usuario/${user.id}`, formData);
      } else {
        await api.post(`/categorias/usuario/${user.id}`, formData);
      }
      cerrarModal();
      fetchCategorias();
    } catch (error) {
      alert("Error al guardar categoría");
    } finally {
      setSubmitting(false);
    }
  };

  const abrirEditar = (cat: Categoria) => {
    setEditingId(cat.id);
    setFormData({ name: cat.name, icon: cat.icon, color: cat.color });
    setIsModalOpen(true);
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: "", icon: "🛒", color: "#3b82f6" });
  };

  const eliminarCategoria = async (id: number) => {
    if (
      !confirm(
        "¿Eliminar categoría? Los gastos asociados podrían quedar huérfanos.",
      )
    )
      return;
    try {
      await api.delete(`/categorias/${id}/usuario/${user?.id}`);
      fetchCategorias();
    } catch (error) {
      alert("Error al eliminar");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-gray-800">
      <div className="max-w-4xl mx-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <button
              onClick={() => router.push("/dashboard")}
              className="text-blue-600 font-bold mb-2 flex items-center gap-2"
            >
              ← Dashboard
            </button>
            <h1 className="text-3xl font-black tracking-tighter">Categorías</h1>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-gray-900 text-white px-6 py-3 rounded-2xl font-black text-sm hover:scale-105 transition-all"
          >
            + NUEVA
          </button>
        </div>

        {/* LISTA DE CATEGORÍAS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {loading ? (
            <p className="col-span-full text-center py-20 font-bold text-slate-300 italic">
              Cargando categorías...
            </p>
          ) : (
            Array.isArray(categorias) &&
            categorias.map((cat) => (
              <div
                key={cat.id}
                className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${cat.color}20` }}
                  >
                    {cat.icon}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 uppercase text-sm tracking-widest">
                      {cat.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      ></div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        {cat.color}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => abrirEditar(cat)}
                    className="p-2 hover:bg-blue-50 text-blue-600 rounded-xl transition-colors"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => eliminarCategoria(cat.id)}
                    className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-colors"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* MODAL */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-[3rem] p-10 w-full max-w-md shadow-2xl">
              <h2 className="text-2xl font-black mb-6 italic uppercase tracking-tighter">
                {editingId ? "Editar Categoría" : "Nueva Categoría"}
              </h2>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">
                    Nombre
                  </label>
                  <input
                    required
                    className="w-full p-4 bg-slate-50 rounded-2xl outline-none border-2 border-transparent focus:border-blue-500 font-bold"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Ej: Restaurantes"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">
                      Icono
                    </label>
                    <select
                      className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold"
                      value={formData.icon}
                      onChange={(e) =>
                        setFormData({ ...formData, icon: e.target.value })
                      }
                    >
                      <option>🛒</option>
                      <option>🍔</option>
                      <option>🚗</option>
                      <option>🏠</option>
                      <option>🎬</option>
                      <option>💊</option>
                      <option>👕</option>
                      <option>🔌</option>
                      <option>✈️</option>
                      <option>🎁</option>
                      <option>🎮</option>
                      <option>📦</option>
                      <option>💸</option>
                      <option>👶🏻</option>
                      <option>🚐</option>
                      <option>🏦</option>
                      <option>🐾</option>
                      <option>🎓</option>
                      <option>💇</option>
                      <option>📈</option>
                      <option>🌀</option>
                      <option>💳</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">
                      Color
                    </label>
                    <input
                      type="color"
                      className="w-full h-[56px] p-1 bg-slate-50 rounded-2xl cursor-pointer"
                      value={formData.color}
                      onChange={(e) =>
                        setFormData({ ...formData, color: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={cerrarModal}
                    className="flex-1 py-4 font-bold text-slate-400 uppercase text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-4 bg-gray-900 text-white font-black rounded-2xl shadow-lg uppercase text-xs"
                  >
                    {submitting ? "..." : "Guardar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
