"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import api from "../lib/axios";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";

// 1. Definimos la estructura de lo que esperamos del login
interface RegistroResponse {
  msg: string;
}

export default function RegistroPage() {
  // Es buena práctica definir la interfaz
  interface FormValues {
    nombre: string;
    apellido: string;
    email: string;
    password: string;
  }

  const initialValues: FormValues = {
    nombre: "",
    apellido: "",
    email: "",
    password: "",
  };

  const [dataRegistro, setDataRegistro] = useState<FormValues>(initialValues);
  const [errorMessage, setErrorMessage] = useState<string>("");
  //   const [email, setEmail] = useState<string>("");
  //   const [password, setPassword] = useState<string>("");
  const router = useRouter();

  // 2. Tipamos el evento del formulario como FormEvent
  const handleRegistro = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      // Tipamos la respuesta para que coincida con tu ResponseDTO de Java
      const res = await api.post<{ message: string; error: boolean }>(
        "/auth/register",
        dataRegistro,
      );

      // Si llegamos aquí es un 200 OK
      console.log(res.data.message); // "Usuario registrado exitosamente"
      router.push("/login");
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;

      // Axios pone el cuerpo de la respuesta (tu ResponseDTO) en error.response.data
      const message =
        error.response?.data?.message || "Ocurrió un error inesperado";

      setErrorMessage(message);
      // Ahora 'message' será exactamente: "Error: El email ya está en uso"
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen ">
      <form
        onSubmit={handleRegistro}
        className="p-8 bg-gray-100 rounded shadow-md"
      >
        {errorMessage && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
            role="alert"
          >
            {errorMessage}
          </div>
        )}

        <h1 className="mb-4 text-2xl font-bold text-black">Registro</h1>

        <input
          type="text"
          placeholder="Ingresa tu nombre"
          className="w-full p-2 mb-4 border text-black"
          // 3. Tipamos el evento del input como ChangeEvent
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setDataRegistro({ ...dataRegistro, nombre: e.target.value })
          }
          required
        />

        <input
          type="text"
          placeholder="Ingresa tu apellido"
          className="w-full p-2 mb-4 border text-black"
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setDataRegistro({ ...dataRegistro, apellido: e.target.value })
          }
          required
        />

        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 mb-4 border text-black"
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setDataRegistro({ ...dataRegistro, email: e.target.value })
          }
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 mb-4 border text-black"
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setDataRegistro({ ...dataRegistro, password: e.target.value })
          }
          required
        />

        <button
          type="submit"
          className="w-full p-2 bg-blue-500 text-white rounded"
        >
          Registrar
        </button>
      </form>
    </div>
  );
}
