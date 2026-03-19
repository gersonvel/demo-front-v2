"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import api from "../lib/axios";
import { useAuth } from "../context/AuthContext";
import { ResponseDTO } from "../types/types";

interface Ahorro {
  id: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  icon: string;
  color: string;
}

interface AhorroHistorial {
  id: number;
  amount: number;
  type: string;
  description: string;
  date: string;
}

export default function AhorrosPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [ahorros, setAhorros] = useState<Ahorro[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal para Crear/Editar Manual
  const [isAbonoModalOpen, setIsAbonoModalOpen] = useState(false); // Modal para Transacciones
  const [isHistorialOpen, setIsHistorialOpen] = useState(false); // Panel Lateral
  const [selectedAhorro, setSelectedAhorro] = useState<Ahorro | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [historial, setHistorial] = useState<AhorroHistorial[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  // Estado para Crear/Editar Manual
  const [formData, setFormData] = useState({
    name: "",
    targetAmount: "",
    currentAmount: "0",
    icon: "💰",
    color: "#3b82f6",
  });

  // Estado para Transacciones (Historial)
  const [transaccion, setTransaccion] = useState({
    amount: "",
    type: "DEPOSITO",
    description: "",
  });

  const fetchAhorros = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const res = await api.get<ResponseDTO<Ahorro[]>>(
        `/ahorros/usuario/${user.id}`,
      );
      setAhorros(res.data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAhorros();
  }, [user?.id]);

  // --- LÓGICA 1: ACTUALIZACIÓN MANUAL (Editar Meta) ---
  const abrirEditar = (item: Ahorro) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      targetAmount: item.targetAmount.toString(),
      currentAmount: item.currentAmount.toString(), // Aquí permites el cambio manual
      icon: item.icon,
      color: item.color,
    });
    setIsModalOpen(true);
  };

  const handleSaveMeta = async (e: FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setSubmitting(true);
    const payload = {
      ...formData,
      targetAmount: Number(formData.targetAmount),
      currentAmount: Number(formData.currentAmount),
    };
    try {
      if (editingId) {
        await api.post(
          `/ahorros/actualizar/${editingId}/usuario/${user.id}`,
          payload,
        );
      } else {
        await api.post(`/ahorros/usuario/${user.id}`, payload);
      }
      cerrarModal();
      fetchAhorros();
    } catch (error) {
      alert("Error al guardar");
    } finally {
      setSubmitting(false);
    }
  };

  // --- LÓGICA 2: TRANSACCIONES (Historial) ---
  const handleConfirmarTransaccion = async (e: FormEvent) => {
    e.preventDefault();
    if (!user?.id || !selectedAhorro) return;
    setSubmitting(true);
    try {
      await api.post(
        `/ahorros-historial/registrar/${selectedAhorro.id}/usuario/${user.id}`,
        {
          amount: Number(transaccion.amount),
          type: transaccion.type,
          description:
            transaccion.description ||
            (transaccion.type === "DEPOSITO" ? "Abono" : "Retiro"),
        },
      );
      setIsAbonoModalOpen(false);
      setTransaccion({ amount: "", type: "DEPOSITO", description: "" });
      fetchAhorros();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error");
    } finally {
      setSubmitting(false);
    }
  };

  const verHistorial = async (savingId: number) => {
    setIsHistorialOpen(true);
    setLoadingHistorial(true);
    try {
      const res = await api.get<ResponseDTO<AhorroHistorial[]>>(
        `/ahorros-historial/meta/${savingId}/usuario/${user?.id}`,
      );
      setHistorial(res.data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingHistorial(false);
    }
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      name: "",
      targetAmount: "",
      currentAmount: "0",
      icon: "💰",
      color: "#3b82f6",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-gray-800">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <button
              onClick={() => router.push("/dashboard")}
              className="text-blue-600 font-medium mb-2 block"
            >
              ← Dashboard
            </button>
            <h1 className="text-3xl font-black">Ahorros</h1>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold"
          >
            + Meta
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ahorros.map((item) => {
            const porcentaje = Math.min(
              Math.round((item.currentAmount / item.targetAmount) * 100),
              100,
            );
            return (
              <div
                key={item.id}
                className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 relative"
              >
                <div className="absolute top-6 right-6 flex gap-3">
                  <button
                    onClick={() => abrirEditar(item)}
                    className="text-slate-400 hover:text-blue-500 font-black text-[10px] uppercase"
                  >
                    Editar Manual
                  </button>
                  <button
                    onClick={() => verHistorial(item.id)}
                    className="text-slate-400 hover:text-blue-500 font-black text-[10px] uppercase"
                  >
                    Historial
                  </button>
                </div>

                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-black">{item.name}</h3>
                <p className="text-xs font-bold text-slate-400 mb-6 uppercase">
                  Objetivo: ${item.targetAmount.toLocaleString()}
                </p>

                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <span
                      className="text-3xl font-black"
                      style={{ color: item.color }}
                    >
                      ${item.currentAmount.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-black text-slate-400">
                      {porcentaje}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-1000"
                      style={{
                        width: `${porcentaje}%`,
                        backgroundColor: item.color,
                      }}
                    ></div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedAhorro(item);
                      setIsAbonoModalOpen(true);
                    }}
                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest mt-2"
                  >
                    Registrar Movimiento
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* MODAL: CREAR / EDITAR MANUAL */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[3rem] p-10 w-full max-w-md">
              <h2 className="text-xl font-black mb-6 uppercase tracking-tight">
                {editingId ? "Editar Meta (Manual)" : "Nueva Meta"}
              </h2>
              <form onSubmit={handleSaveMeta} className="space-y-4">
                <input
                  required
                  placeholder="Nombre"
                  className="w-full p-4 bg-slate-50 rounded-2xl outline-none"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">
                      Meta Total
                    </label>
                    <input
                      required
                      type="number"
                      className="w-full p-4 bg-slate-50 rounded-2xl outline-none"
                      value={formData.targetAmount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          targetAmount: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 ml-2 uppercase text-blue-600">
                      Saldo Actual
                    </label>
                    <input
                      required
                      type="number"
                      className="w-full p-4 bg-blue-50/50 rounded-2xl outline-none border-2 border-blue-100"
                      value={formData.currentAmount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          currentAmount: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={cerrarModal}
                    className="flex-1 py-4 font-bold text-slate-400"
                  >
                    CANCELAR
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl uppercase"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ABONAR / RETIRAR (HISTORIAL) */}
        {isAbonoModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[3rem] p-10 w-full max-w-sm">
              <h2 className="text-xl font-black mb-6 text-center uppercase tracking-tight">
                Movimiento
              </h2>
              <form onSubmit={handleConfirmarTransaccion} className="space-y-4">
                <div className="flex bg-slate-100 p-1 rounded-2xl">
                  <button
                    type="button"
                    onClick={() =>
                      setTransaccion({ ...transaccion, type: "DEPOSITO" })
                    }
                    className={`flex-1 py-2 rounded-xl text-[10px] font-black ${transaccion.type === "DEPOSITO" ? "bg-white text-green-600" : "text-slate-400"}`}
                  >
                    DEPÓSITO
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setTransaccion({ ...transaccion, type: "RETIRO" })
                    }
                    className={`flex-1 py-2 rounded-xl text-[10px] font-black ${transaccion.type === "RETIRO" ? "bg-white text-red-600" : "text-slate-400"}`}
                  >
                    RETIRO
                  </button>
                </div>
                <input
                  required
                  type="number"
                  step="0.01"
                  className="w-full p-6 bg-slate-50 rounded-3xl text-3xl font-black text-center outline-none"
                  placeholder="$0.00"
                  value={transaccion.amount}
                  onChange={(e) =>
                    setTransaccion({ ...transaccion, amount: e.target.value })
                  }
                />
                <input
                  placeholder="Nota (opcional)"
                  className="w-full p-4 bg-slate-50 rounded-2xl text-sm text-center outline-none"
                  value={transaccion.description}
                  onChange={(e) =>
                    setTransaccion({
                      ...transaccion,
                      description: e.target.value,
                    })
                  }
                />
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAbonoModalOpen(false)}
                    className="flex-1 py-4 font-bold text-slate-400"
                  >
                    ATRÁS
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`flex-1 py-4 text-white font-black rounded-2xl ${transaccion.type === "DEPOSITO" ? "bg-green-600" : "bg-red-600"}`}
                  >
                    CONFIRMAR
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PANEL LATERAL: HISTORIAL */}
        {/* {isHistorialOpen && (
          <div className="fixed inset-0 z-[60] flex justify-end">
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsHistorialOpen(false)}
            />
            <div className="relative w-full max-w-md bg-white h-full p-8 overflow-y-auto animate-in slide-in-from-right">
              <h2 className="text-2xl font-black uppercase mb-8">Historial</h2>
              <div className="space-y-4">
                {loadingHistorial ? (
                  <p className="text-center font-bold text-slate-300">
                    Cargando...
                  </p>
                ) : historial.length === 0 ? (
                  <p className="text-center text-slate-400">Sin movimientos</p>
                ) : (
                  historial.map((h) => (
                    <div
                      key={h.id}
                      className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 flex justify-between items-center"
                    >
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase">
                          {new Date(h.date).toLocaleDateString()}
                        </p>
                        <p className="font-bold text-sm">{h.description}</p>
                      </div>
                      <p
                        className={`text-lg font-black ${h.type === "DEPOSITO" ? "text-green-600" : "text-red-600"}`}
                      >
                        {h.type === "DEPOSITO" ? "+" : "-"}$
                        {h.amount.toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )} */}

        {/* MODAL HISTORIAL */}
        {isHistorialOpen && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-[3rem] p-10 w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black uppercase">Historial</h2>
                <button
                  onClick={() => setIsHistorialOpen(false)}
                  className="text-3xl text-gray-300"
                >
                  ×
                </button>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {loadingHistorial ? (
                  <p className="text-center font-bold text-slate-300">
                    Cargando...
                  </p>
                ) : historial.length === 0 ? (
                  <p className="text-center text-slate-400">Sin movimientos</p>
                ) : (
                  historial.map((h) => (
                    <div
                      key={h.id}
                      className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 flex justify-between items-center"
                    >
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase">
                          {new Date(h.date).toLocaleDateString()}
                        </p>
                        <p className="font-bold text-sm">{h.description}</p>
                      </div>
                      <p
                        className={`text-lg font-black ${h.type === "DEPOSITO" ? "text-green-600" : "text-red-600"}`}
                      >
                        {h.type === "DEPOSITO" ? "+" : "-"}$
                        {h.amount.toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
