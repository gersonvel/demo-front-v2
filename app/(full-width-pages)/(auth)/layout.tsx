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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Este código se ejecuta cuando el DOM y los scripts base ya están listos
    // Si quieres un pequeño respiro para que no "parpadee" muy rápido:
    const handleLoad = () => {
      // Opcional: un pequeño delay de 500ms para que la transición sea suave
      setTimeout(() => setIsLoading(false), 500);
    };

    if (document.readyState === "complete") {
      handleLoad();
    } else {
      window.addEventListener("load", handleLoad);
      return () => window.removeEventListener("load", handleLoad);
    }
  }, []);

  return (
    <ThemeProvider>
      {isLoading ? (
        /* --- PANTALLA DE CARGA REAL --- */
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white dark:bg-gray-900 transition-opacity duration-500">
          <div className="relative flex flex-col items-center">
            <Image
              width={120}
              height={120}
              src="/images/logo/auth-logo.svg"
              alt="Logo"
              className="animate-pulse"
            />
            {/* Un spinner opcional para indicar que "está trabajando" */}
            <div className="mt-4 h-1 w-32 bg-gray-200 overflow-hidden rounded">
              <div className="h-full bg-brand-950 animate-progress origin-left"></div>
            </div>
          </div>
        </div>
      ) : (
        /* --- TU LAYOUT ORIGINAL --- */
        <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
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
