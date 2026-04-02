"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import api from "../lib/axios"; // Importa tu configuración de Axios con interceptores
import { AuthContextType, User } from "../types/types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Empezamos bloqueando la vista
  const router = useRouter();
  const pathname = usePathname();

  const checkAuth = async () => {
    const token = localStorage.getItem("accessToken");
    const publicRoutes = ["/login", "/registro", "/"];

    if (token) {
      try {
        // LLAMADA AL BACKEND: Traemos los datos frescos del usuario
        // El interceptor de Axios se encargará de poner el "Bearer token"
        const response = await api.get("/usuarios/me");

        // Guardamos el objeto usuario en el estado (Memoria de React)
        setUser(response.data.data);

        // Si el usuario ya está logueado e intenta ir a Login, mándalo al Dashboard
        if (publicRoutes.includes(pathname)) {
          router.replace("/dashboard");
        }
      } catch (error) {
        console.error("Sesión expirada o token inválido");
        logout(); // Si falla el /me, limpiamos todo por seguridad
      }
    } else {
      // Si NO hay token y no es ruta pública, al login
      if (!publicRoutes.includes(pathname)) {
        router.replace("/login");
      }
    }

    // IMPORTANTE: Quitamos el estado de carga al terminar la validación
    setLoading(false);
  };

  // Dentro de AuthProvider en AuthContext.tsx

  const login = (token: string, refreshToken: string, userData: User) => {
    localStorage.setItem("accessToken", token);
    localStorage.setItem("refreshToken", refreshToken);

    // 1. Seteamos el usuario inmediatamente en memoria
    setUser(userData);

    // 2. Quitamos el loading para que no aparezca el spinner
    setLoading(false);

    // 3. Redirigimos manualmente (o deja que checkAuth lo haga,
    // pero push es más directo aquí)
    router.push("/dashboard");
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
    router.replace("/login");
  };

  useEffect(() => {
    checkAuth();
  }, []); // Solo se ejecuta una vez al cargar la web

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {/* Si loading es true, mostramos el splash screen, 
         pero NO eliminamos 'children' del árbol de React.
      */}
      {loading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-bold text-gray-400 italic">
              Validando Sesión...
            </p>
          </div>
        </div>
      )}

      {/* Renderizamos children siempre. 
         Si quieres que no se vea nada mientras carga, puedes envolverlo en un div oculto 
         o simplemente dejar que el overlay de arriba lo tape.
      */}
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  return context;
};
