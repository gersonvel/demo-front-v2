"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useState, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import api from "@/app/lib/axios";
import Button from "../ui/button/Button";


export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [cargando, setCargando] = useState<boolean>(false);
  const [alertColor, setAlertColor] = useState<String>("");
  

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

  const handleRegistro = async (e: FormEvent<HTMLFormElement>) => {

    e.preventDefault();
    setErrorMessage("");
    setAlertColor("");
    setCargando(true);

    if (!isChecked) {
      setErrorMessage("Acepta nuestros terminos y condiciones");
      setAlertColor("yellow");
          setCargando(false);

      
      return;
    }


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
      setAlertColor("red");
      // Ahora 'message' será exactamente: "Error: El email ya está en uso"
    }
     finally {
      setCargando(false);
    }
  };
  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full overflow-y-auto no-scrollbar">
      <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        <Link
          href="/login"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon />
          Regresar a login
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Registrarse
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ingresa ty email y password para registrarte!
            </p>
          </div>

          {errorMessage && (
         <div
            className={`border px-4 py-3 rounded relative mb-4 ${
              alertColor === "red"
                ? "bg-red-100 border-red-400 text-red-700"
                : "bg-yellow-100 border-yellow-400 text-yellow-700"
            }`}
            role="alert"
          >
            {errorMessage}
          </div>
        )}
          <div>
           
       
            <form
            onSubmit={handleRegistro}
            >
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {/* <!-- First Name --> */}
                  <div className="sm:col-span-1">
                    <Label>
                      Nombre<span className="text-error-500">*</span>
                    </Label>
      
                    <Input
                      type="text"
                      id="fname"
                      name="fname"
                      placeholder="Ingresa tu nombre"
                       onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setDataRegistro({ ...dataRegistro, nombre: e.target.value })
                      }
                      required
                    />
                  </div>
                  {/* <!-- Last Name --> */}
                  <div className="sm:col-span-1">
                    <Label>
                      Apellidos<span className="text-error-500">*</span>
                    </Label>

  
                    <Input
                      type="text"
                      id="lname"
                      name="lname"
                      placeholder="Ingresa tus apellidos"
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setDataRegistro({ ...dataRegistro, apellido: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                {/* <!-- Email --> */}
                <div>
                  <Label>
                    Email<span className="text-error-500">*</span>
                  </Label>


                  <Input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Ingresa email"
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setDataRegistro({ ...dataRegistro, email: e.target.value })
                    }
                    required
                  />
                </div>
                {/* <!-- Password --> */}
                <div>
                  <Label>
                    Password<span className="text-error-500">*</span>
                  </Label>


                  <div className="relative">
                    <Input
                      placeholder="Ingresa tu password"
                      type={showPassword ? "text" : "password"}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setDataRegistro({ ...dataRegistro, password: e.target.value })
                    }
                    required
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                      )}
                    </span>
                  </div>
                </div>
                {/* <!-- Checkbox --> */}
                <div className="flex items-center gap-3">
                  <Checkbox
                    className="w-5 h-5"
                    checked={isChecked}
                    onChange={setIsChecked}
                  />
                  <p className="inline-block font-normal text-gray-500 dark:text-gray-400">
                    Registrandote estas de acuerdo con los{" "}
                    <span className="text-gray-800 dark:text-white/90">
                      Terminos y Condiciones,
                    </span>{" "}
                    y nuestro{" "}
                    <span className="text-gray-800 dark:text-white">
                      Aviso de Provacidad
                    </span>
                  </p>
                </div>
                {/* <!-- Button --> */}
                <div>
              
                      <Button
                    type="submit"
                    size="sm"
                    disabled={cargando}
                    className={`w-full p-2 text-white font-semibold rounded transition-colors ${
                      cargando ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {cargando ? "Registrando..." : "Registrarse"}
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Ya tengo una cuenta? {" "}
                <Link
                  href="/login"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                   Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
