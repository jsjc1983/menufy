"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(JSON.stringify({
      level: "error",
      message: "Unhandled application error",
      digest: error.digest,
      timestamp: new Date().toISOString(),
    }));
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold">No hemos podido completar la operación</h1>
        <p className="text-muted-foreground">
          No se han mostrado detalles técnicos para proteger la información. Puedes volver a intentarlo.
        </p>
        <Button onClick={reset}>Reintentar</Button>
      </div>
    </main>
  );
}
