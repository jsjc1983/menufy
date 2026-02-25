import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Menufy - Gestiona menús de grupo sin complicaciones",
  description:
    "Menufy permite a restaurantes gestionar menús de grupo para eventos, y a los invitados elegir sus platos y declarar alérgenos sin registrarse.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
