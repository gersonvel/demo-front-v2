// "use client";

// import { useState, FormEvent, ChangeEvent } from "react";
// import api from "../lib/axios";
// import { AxiosError } from "axios";
// import { useAuth } from "../context/AuthContext";
// import { ApiResponse, User } from "../types/types";
// import { useRouter } from "next/navigation";

// export default function LoginPage() {
//   const router = useRouter();
//   const { login } = useAuth();
//   const [email, setEmail] = useState<string>("");
//   const [password, setPassword] = useState<string>("");

//   // NUEVO: Estado para el mensaje de error
//   const [errorMsg, setErrorMsg] = useState<string | null>(null);
//   const [cargando, setCargando] = useState<boolean>(false);

//   const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     setErrorMsg(null); // Limpiamos errores previos
//     setCargando(true);

//     try {
//       const res = await api.post<ApiResponse<any>>("/auth/login", {
//         email,
//         password,
//       });

//       const { accessToken, refreshToken, user } = res.data.data;
//       login(accessToken, refreshToken, user);
//     } catch (err) {
//       const error = err as AxiosError<ApiResponse<null>>;

//       // Extraemos el mensaje real que viene de tu ResponseDTO de Java
//       const message = error.response?.data?.message || "Credenciales inválidas";

//       setErrorMsg(message); // Lo guardamos para mostrarlo en el HTML
//     } finally {
//       setCargando(false);
//     }
//   };

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen">
//       <form
//         onSubmit={handleLogin}
//         className="p-8 bg-gray-100 rounded shadow-md w-full max-w-sm"
//       >
//         <h1 className="mb-4 text-2xl font-bold text-black text-center">
//           Login
//         </h1>

//         {/* MOSTRAR ERROR AQUÍ */}
//         {errorMsg && (
//           <div className="mb-4 p-2 bg-red-100 border-l-4 border-red-500 text-red-700 text-sm">
//             {errorMsg}
//           </div>
//         )}

//         <input
//           type="email"
//           placeholder="Email"
//           className="w-full p-2 mb-4 border text-black rounded"
//           value={email}
//           onChange={(e: ChangeEvent<HTMLInputElement>) =>
//             setEmail(e.target.value)
//           }
//           required
//         />

//         <input
//           type="password"
//           placeholder="Password"
//           className="w-full p-2 mb-6 border text-black rounded"
//           value={password}
//           onChange={(e: ChangeEvent<HTMLInputElement>) =>
//             setPassword(e.target.value)
//           }
//           required
//         />

//         <button
//           type="submit"
//           disabled={cargando}
//           className={`w-full p-2 text-white font-semibold rounded transition-colors ${
//             cargando ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
//           }`}
//         >
//           {cargando ? "Entrando..." : "Entrar"}
//         </button>
//       </form>

//       <button
//         onClick={() => router.push("/registro")}
//         className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 mb-2"
//       >
//         Registro
//       </button>
//     </div>
//   );
// }
import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Next.js SignIn Page | TailAdmin - Next.js Dashboard Template",
  description: "This is Next.js Signin Page TailAdmin Dashboard Template",
};

export default function LoginPage() {
  return <SignInForm />;
}
