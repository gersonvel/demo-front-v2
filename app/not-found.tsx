import Link from "next/link";

export default function NotFound() {
  return (
    <div>
      <h2>Página no encontrada</h2>

      <Link href="/login">Volver al inicio</Link>
    </div>
  );
}
