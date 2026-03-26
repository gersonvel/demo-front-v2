"use client";
import GridShape from "@/components/common/GridShape";
import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";
import { ThemeProvider } from "@/context/ThemeContext";
import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect } from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isWelcoming, setIsWelcoming] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsWelcoming(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ThemeProvider>
      {isWelcoming ? (
        /* --- ESTA ES TU PANTALLA DE BIENVENIDA --- */
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-brand-950 dark:bg-gray-900 animate-fade-in">
          <Image
            width={150}
            height={150}
            src="/images/logo/auth-logo.svg" // Tu logo de la PWA
            alt="Logo"
            className="animate-pulse"
          />
          <h2 className="mt-6 text-2xl font-bold text-white">
            ¡Bienvenido de nuevo!
          </h2>
          <p className="mt-2 text-gray-400">Iniciando aplicación...</p>
        </div>
      ) : (
        /* --- ESTE ES TU LAYOUT ORIGINAL --- */
        <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0 animate-fade-in">
          <div className="fixed inset-0 flex flex-col lg:flex-row w-full h-full justify-center items-center dark:bg-gray-900 overflow-hidden touch-pan-y p-6 sm:p-0">
            {children}
            <div className="lg:w-1/2 w-full h-full bg-brand-950 dark:bg-white/5 lg:grid items-center hidden">
              <div className="relative items-center justify-center flex z-1">
                <GridShape />
                <div className="flex flex-col items-center max-w-xs">
                  <Link href="/" className="block mb-4">
                    <Image
                      width={231}
                      height={48}
                      src="/images/logo/auth-logo.svg"
                      alt="Logo"
                    />
                  </Link>
                  <p className="text-center text-gray-400 dark:text-white/60">
                    Free and Open-Source Tailwind CSS Admin Dashboard Template
                  </p>
                </div>
              </div>
            </div>
            <div className="fixed bottom-6 right-6 z-50 hidden sm:block">
              <ThemeTogglerTwo />
            </div>
          </div>
        </div>
      )}
    </ThemeProvider>
  );
}
