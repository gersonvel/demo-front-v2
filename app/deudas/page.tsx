"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import api from "../lib/axios";
import { useAuth } from "../context/AuthContext";
import { ResponseDTO } from "../types/types";

// --- INTERFACES ---
interface Deuda {
  id: number;
  name: string;
  totalAmount: number;
  balance: number;
  monthlyPayment: number;
  dueDateDay: number;
  startDate: string;
}

interface PagoDeuda {
  id: number;
  amount: number;
  date: string;
  note: string;
}

export default function DeudasPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [deudas, setDeudas] = useState<Deuda[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeuda, setSelectedDeuda] = useState<Deuda | null>(null);
  const [historialPagos, setHistorialPagos] = useState<PagoDeuda[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeudaId, setEditingDeudaId] = useState<number | null>(null);
  const [isAbonoModalOpen, setIsAbonoModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [montoAbono, setMontoAbono] = useState("");
  const [notaAbono, setNotaAbono] = useState("Pago mensual");
  const [newDeudaData, setNewDeudaData] = useState({
    name: "",
    totalAmount: "",
    monthlyPayment: "",
    dueDateDay: "1",
    startDate: new Date().toISOString().split("T")[0],
  });

  const fetchDeudas = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const response = await api.get<ResponseDTO<Deuda[]>>(
        `/deudas/usuario/${user.id}`,
      );
      setDeudas(response.data.data || []);
      console.log(response.data.data);
    } catch (error) {
      console.error("Error al obtener deudas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeudas();
  }, [user?.id]);

  const abrirEditarDeuda = (deuda: Deuda) => {
    setEditingDeudaId(deuda.id);
    setNewDeudaData({
      name: deuda.name,
      totalAmount: deuda.totalAmount.toString(),
      monthlyPayment: deuda.monthlyPayment.toString(),
      dueDateDay: deuda.dueDateDay.toString(),
      startDate: deuda.startDate,
    });
    setIsModalOpen(true);
  };

  // --- LOGICA DE ENVÍO CORREGIDA PARA EVITAR NULOS ---
  const handleDeudaSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setSubmitting(true);

    // Buscamos la deuda previa para rescatar el balance actual si estamos editando
    const deudaPrevia = deudas.find((d) => d.id === editingDeudaId);

    const payload = {
      name: newDeudaData.name,
      totalAmount: Number(newDeudaData.totalAmount),
      monthlyPayment: Number(newDeudaData.monthlyPayment),
      dueDateDay: Number(newDeudaData.dueDateDay),
      startDate: newDeudaData.startDate,
      // FIX: Si editamos enviamos el balance que ya tenía, si es nueva enviamos el totalAmount
      balance: editingDeudaId
        ? (deudaPrevia?.balance ?? 0)
        : Number(newDeudaData.totalAmount),
    };

    try {
      if (editingDeudaId) {
        await api.post(
          `/deudas/actualizar/${editingDeudaId}/usuario/${user.id}`,
          payload,
        );
      } else {
        await api.post(`/deudas/usuario/${user.id}`, payload);
      }

      cerrarModalRegistro();
      fetchDeudas();
    } catch (error) {
      alert("Error al guardar los cambios en el servidor");
    } finally {
      setSubmitting(false);
    }
  };

  const cerrarModalRegistro = () => {
    setIsModalOpen(false);
    setEditingDeudaId(null);
    setNewDeudaData({
      name: "",
      totalAmount: "",
      monthlyPayment: "",
      dueDateDay: "1",
      startDate: new Date().toISOString().split("T")[0],
    });
  };

  const verHistorial = async (deuda: Deuda) => {
    setSelectedDeuda(deuda);
    setIsHistoryModalOpen(true);
    setHistorialPagos([]);
    try {
      const res = await api.get<ResponseDTO<PagoDeuda[]>>(
        `/deudas/${deuda.id}/pagos/usuario/${user?.id}`,
      );
      setHistorialPagos(res.data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAbonar = async (e: FormEvent) => {
    e.preventDefault();
    if (!user?.id || !selectedDeuda) return;
    setSubmitting(true);
    try {
      await api.post(`/deudas/${selectedDeuda.id}/abonar/usuario/${user.id}`, {
        monto: Number(montoAbono),
        nota: notaAbono,
      });
      setIsAbonoModalOpen(false);
      setMontoAbono("");
      fetchDeudas();
    } catch (error) {
      alert("Error");
    } finally {
      setSubmitting(false);
    }
  };

  const totalDeudaGlobal = deudas.reduce((acc, d) => acc + (d.balance || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-gray-800">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <button
              onClick={() => router.push("/dashboard")}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 mb-2"
            >
              ← Volver al Dashboard
            </button>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Deudas
            </h1>
          </div>
          <div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold shadow-xl transition-all active:scale-95"
            >
              + Registrar Deuda
            </button>
          </div>
        </div>

        <div className="flex justify-end mb-4">
          <div className="bg-white px-10 py-6 rounded-[2.5rem] shadow-sm border-l-[12px] border-red-500">
            <p className="text-gray-400 text-xs font-black uppercase tracking-widest">
              Saldo Total
            </p>
            <p className="text-4xl font-black text-gray-900">
              ${totalDeudaGlobal.toLocaleString()}
            </p>
          </div>
        </div>

        {/* LISTADO DE TARJETAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 mb-12">
          {loading ? (
            <p className="col-span-full text-center py-20 font-bold text-gray-300">
              Cargando...
            </p>
          ) : (
            deudas.map((deuda) => {
              const pagado = (deuda.totalAmount || 0) - (deuda.balance || 0);
              const porcentaje = Math.min(
                Math.round((pagado / (deuda.totalAmount || 1)) * 100),
                100,
              );
              return (
                <div
                  key={deuda.id}
                  className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-2xl font-black text-gray-800 leading-none">
                          {deuda.name}
                        </h3>
                        <button
                          onClick={() => abrirEditarDeuda(deuda)}
                          className="text-[10px] font-bold text-blue-500 hover:underline mt-1"
                        >
                          EDITAR DATOS ✎
                        </button>
                      </div>
                      <span className="bg-gray-900 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">
                        Día {deuda.dueDateDay}
                      </span>
                    </div>
                    <div className="flex justify-between items-end">
                      <p
                        className={`text-3xl font-black ${deuda.balance > 0 ? "text-gray-900" : "text-green-500"}`}
                      >
                        ${deuda.balance.toLocaleString()}
                      </p>
                      <p className="text-[10px] font-black text-gray-400 uppercase">
                        Mes: ${deuda.monthlyPayment}
                      </p>
                    </div>
                    <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden">
                      <div
                        className={`${porcentaje >= 100 ? "bg-green-500" : "bg-blue-600"} h-full transition-all duration-1000`}
                        style={{ width: `${porcentaje}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-8">
                    <button
                      onClick={() => verHistorial(deuda)}
                      className="flex-1 py-4 text-[10px] font-black bg-gray-50 rounded-2xl hover:bg-gray-100 transition"
                    >
                      PAGOS
                    </button>
                    {deuda.balance > 0 ? (
                      <button
                        onClick={() => {
                          setSelectedDeuda(deuda);
                          setIsAbonoModalOpen(true);
                        }}
                        className="flex-1 py-4 text-[10px] font-black bg-blue-600 text-white rounded-2xl shadow-lg"
                      >
                        ABONAR
                      </button>
                    ) : (
                      <div className="flex-1 py-4 text-[10px] font-black bg-green-50 text-green-600 rounded-2xl border border-green-100 flex items-center justify-center uppercase">
                        ✓ Liquidada
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* MODAL REGISTRO / EDICIÓN */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-[3rem] p-10 w-full max-w-md shadow-2xl">
              <h2 className="text-3xl font-black mb-6">
                {editingDeudaId ? "EDITAR DEUDA" : "NUEVA DEUDA"}
              </h2>
              <form onSubmit={handleDeudaSubmit} className="space-y-4">
                <input
                  required
                  value={newDeudaData.name}
                  onChange={(e) =>
                    setNewDeudaData({ ...newDeudaData, name: e.target.value })
                  }
                  className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none border-2 border-transparent focus:border-blue-500"
                  placeholder="Nombre"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    required
                    type="number"
                    placeholder="Monto Total"
                    value={newDeudaData.totalAmount}
                    onChange={(e) =>
                      setNewDeudaData({
                        ...newDeudaData,
                        totalAmount: e.target.value,
                      })
                    }
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none"
                  />
                  <input
                    required
                    type="number"
                    placeholder="Mensualidad"
                    value={newDeudaData.monthlyPayment}
                    onChange={(e) =>
                      setNewDeudaData({
                        ...newDeudaData,
                        monthlyPayment: e.target.value,
                      })
                    }
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    required
                    type="number"
                    min="1"
                    max="31"
                    value={newDeudaData.dueDateDay}
                    onChange={(e) =>
                      setNewDeudaData({
                        ...newDeudaData,
                        dueDateDay: e.target.value,
                      })
                    }
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none"
                    placeholder="Día de pago"
                  />
                  <input
                    required
                    type="date"
                    value={newDeudaData.startDate}
                    onChange={(e) =>
                      setNewDeudaData({
                        ...newDeudaData,
                        startDate: e.target.value,
                      })
                    }
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={cerrarModalRegistro}
                    className="flex-1 py-4 font-bold text-gray-400"
                  >
                    CANCELAR
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl"
                  >
                    {submitting ? "..." : "GUARDAR"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL HISTORIAL */}
        {isHistoryModalOpen && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-[3rem] p-10 w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black uppercase">Historial</h2>
                <button
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="text-3xl text-gray-300"
                >
                  ×
                </button>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {historialPagos.length === 0 && (
                  <p className="text-center text-gray-400">
                    No hay historial de pagos
                  </p>
                )}
                {historialPagos.map((p) => (
                  <div
                    key={p.id}
                    className="flex justify-between items-center p-5 bg-gray-50 rounded-3xl border border-gray-100"
                  >
                    <div>
                      <p className="text-lg font-black text-gray-900">
                        ${Number(p.amount || 0).toLocaleString()}
                      </p>
                      <p className="text-[10px] text-gray-400 font-bold">
                        {p.date
                          ? new Date(p.date).toLocaleDateString("es-ES")
                          : "---"}
                      </p>
                    </div>
                    <p className="text-[10px] font-black text-blue-500 uppercase">
                      {p.note || "Abono"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MODAL ABONAR */}
        {isAbonoModalOpen && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-[3rem] p-10 w-full max-w-sm shadow-2xl">
              <h2 className="text-2xl font-black mb-6">ABONAR</h2>
              <form onSubmit={handleAbonar} className="space-y-4">
                <input
                  required
                  type="number"
                  step="0.01"
                  value={montoAbono}
                  onChange={(e) => setMontoAbono(e.target.value)}
                  className="w-full px-6 py-5 bg-gray-50 rounded-2xl outline-none border-2 border-transparent focus:border-blue-500 font-black text-2xl"
                  placeholder="$0.00"
                />
                <input
                  value={notaAbono}
                  onChange={(e) => setNotaAbono(e.target.value)}
                  className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none"
                  placeholder="Nota"
                />
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAbonoModalOpen(false)}
                    className="flex-1 py-4 font-bold text-gray-400"
                  >
                    SALIR
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl"
                  >
                    PAGAR
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
