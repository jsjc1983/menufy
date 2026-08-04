import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gruppy - Gestiona menús de grupo sin complicaciones",
  description:
    "Gruppy permite a restaurantes gestionar menús de grupo para eventos, y a los invitados elegir sus platos y declarar alérgenos sin registrarse.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Gruppy",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#d97706",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {children}
        <footer className="border-t bg-background px-4 py-6 text-center text-xs text-muted-foreground">
          <div className="flex justify-center gap-4">
            <a href="/privacidad" className="hover:text-foreground">Privacidad</a>
            <a href="/terminos" className="hover:text-foreground">Condiciones</a>
            <a href="mailto:soporte@gruppy.app" className="hover:text-foreground">Soporte</a>
          </div>
        </footer>
      </body>
    </html>
  );
}
