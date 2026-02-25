"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createRestaurant } from "@/lib/actions/restaurant";
import { UtensilsCrossed, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewRestaurantPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!name.trim()) {
      setError("El nombre del restaurante es obligatorio");
      setLoading(false);
      return;
    }
    if (pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin)) {
      setError("El PIN debe tener entre 4 y 6 dígitos numéricos");
      setLoading(false);
      return;
    }

    const result = await createRestaurant({ name: name.trim(), adminPin: pin });
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (result.restaurant) {
      // Store PIN in sessionStorage
      sessionStorage.setItem(`pin_${result.restaurant.id}`, pin);
      router.push(`/restaurant/${result.restaurant.id}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>

        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <UtensilsCrossed className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Registra tu restaurante</CardTitle>
            <CardDescription>
              Crea tu cuenta para empezar a gestionar menús de grupo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del restaurante</Label>
                <Input
                  id="name"
                  placeholder="Ej: Restaurante La Boquería"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pin">PIN de acceso (4-6 dígitos)</Label>
                <Input
                  id="pin"
                  type="password"
                  inputMode="numeric"
                  pattern="\d{4,6}"
                  placeholder="Ej: 1234"
                  value={pin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setPin(val);
                  }}
                  maxLength={6}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Usarás este PIN para acceder a tu panel de gestión
                </p>
              </div>

              {error && (
                <p className="text-sm text-destructive font-medium">{error}</p>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Creando..." : "Crear restaurante"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
