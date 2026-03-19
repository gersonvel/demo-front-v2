import LoginPage from "@/app/(full-width-pages)/(auth)/login/page";
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/login");
  // return <LoginPage />;
}
