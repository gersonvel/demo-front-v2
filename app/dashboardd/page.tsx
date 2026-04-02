import type { Metadata } from "next";
import DashboardContent from "./DashboardContent"; // Importas el que creamos arriba

// Los metadatos se quedan aquí sin problemas
export const metadata: Metadata = {
  title: "Next.js E-commerce Dashboard | TailAdmin",
  description: "This is Next.js Home for TailAdmin Dashboard Template",
};

export default function DashboardPage() {
  return <DashboardContent />;
}
