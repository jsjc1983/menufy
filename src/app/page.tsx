"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { UtensilsCrossed, Users, ChefHat } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [shareCode, setShareCode] = useState("");

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = shareCode.trim().toLowerCase();
    if (code) {
      router.push(`/event/${code}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <UtensilsCrossed className="h-10 w-10 text-primary" />
          <h1 className="text-5xl font-bold text-foreground">Menufy</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-md mx-auto">
          Gestiona menús de grupo sin complicaciones
        </p>
      </div>

      <div className="grid gap-6 w-full max-w-md">
        <Card className="border-2 hover:border-primary/50 transition-colors">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <ChefHat className="h-6 w-6 text-primary" />
              <h2 className="text-lg font-semibold">Soy un restaurante</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Crea menús, gestiona eventos y visualiza los pedidos de tus
              comensales.
            </p>
            <Button
              className="w-full"
              size="lg"
              onClick={() => router.push("/restaurant/new")}
            >
              Empezar
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-secondary/50 transition-colors">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className="h-6 w-6 text-secondary" />
              <h2 className="text-lg font-semibold">
                Tengo un código de invitación
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Introduce el código que te ha enviado el organizador para
              seleccionar tu menú.
            </p>
            <form onSubmit={handleCodeSubmit} className="flex gap-2">
              <Input
                placeholder="Ej: abc123"
                value={shareCode}
                onChange={(e) => setShareCode(e.target.value)}
                maxLength={6}
                className="text-center text-lg tracking-wider"
              />
              <Button type="submit" variant="secondary" size="lg">
                Ir
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <p className="mt-12 text-sm text-muted-foreground">
        Menús de grupo digitalizados. Sin registro. Sin complicaciones.
      </p>
    </div>
  );
}
