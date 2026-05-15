"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { verifyPin, getRestaurant } from "@/lib/actions/restaurant";
import {
  UtensilsCrossed,
  Plus,
  Calendar,
  Users,
  ChefHat,
  Lock,
} from "lucide-react";
import Link from "next/link";

type RestaurantData = NonNullable<Awaited<ReturnType<typeof getRestaurant>>>;

export default function RestaurantPanel() {
  const params = useParams();
  const restaurantId = params.id as string;

  const [authenticated, setAuthenticated] = useState(false);
  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadRestaurant = useCallback(async () => {
    const data = await getRestaurant(restaurantId);
    if (data) {
      setRestaurant(data);
    } else {
      sessionStorage.removeItem(`pin_${restaurantId}`);
      setAuthenticated(false);
    }
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => {
    const storedPin = sessionStorage.getItem(`pin_${restaurantId}`);
    if (storedPin) {
      verifyPin(restaurantId, storedPin).then((result) => {
        if (result.success) {
          setAuthenticated(true);
          loadRestaurant();
        } else {
          sessionStorage.removeItem(`pin_${restaurantId}`);
          setLoading(false);
        }
      });
    } else {
      setLoading(false);
    }
  }, [restaurantId, loadRestaurant]);

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const sanitizedPin = pin.trim();
    const result = await verifyPin(restaurantId, sanitizedPin);
    if (result.error) {
      setError(result.error);
      return;
    }
    sessionStorage.setItem(`pin_${restaurantId}`, sanitizedPin);
    setAuthenticated(true);
    setLoading(true);
    loadRestaurant();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Acceso al panel</CardTitle>
            <CardDescription>
              Introduce tu PIN para acceder al panel del restaurante
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pin">PIN</Label>
                <Input
                  id="pin"
                  type="password"
                  inputMode="numeric"
                  placeholder="Introduce tu PIN"
                  value={pin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setPin(val);
                  }}
                  maxLength={6}
                  autoFocus
                />
              </div>
              {error && (
                <p className="text-sm text-destructive font-medium">{error}</p>
              )}
              <Button type="submit" className="w-full">
                Acceder
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Restaurante no encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <UtensilsCrossed className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">{restaurant.name}</h1>
            <p className="text-sm text-muted-foreground">Panel de gestión</p>
          </div>
        </div>
        <Link href="/">
          <Button variant="ghost" size="sm">
            Inicio
          </Button>
        </Link>
      </div>

      {/* Menus Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Menús</h2>
          </div>
          <Link href={`/restaurant/${restaurantId}/menu/new`}>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Crear menú
            </Button>
          </Link>
        </div>

        {restaurant.menus.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <ChefHat className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                No tienes menús creados todavía.
              </p>
              <Link href={`/restaurant/${restaurantId}/menu/new`}>
                <Button className="mt-4" variant="outline">
                  Crear tu primer menú
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {restaurant.menus.map((menu) => (
              <Card key={menu.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{menu.name}</h3>
                      {menu.description && (
                        <p className="text-sm text-muted-foreground">
                          {menu.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {menu.courses.length} tiempos &middot;{" "}
                        {menu.courses.reduce(
                          (acc, c) => acc + c.dishes.length,
                          0
                        )}{" "}
                        platos
                      </p>
                    </div>
                    <Badge variant="outline">{menu.courses.length} tiempos</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Separator className="my-8" />

      {/* Events Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Eventos</h2>
          </div>
          <Link href={`/restaurant/${restaurantId}/event/new`}>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Crear evento
            </Button>
          </Link>
        </div>

        {restaurant.events.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                No tienes eventos creados todavía.
              </p>
              {restaurant.menus.length > 0 ? (
                <Link href={`/restaurant/${restaurantId}/event/new`}>
                  <Button className="mt-4" variant="outline">
                    Crear tu primer evento
                  </Button>
                </Link>
              ) : (
                <p className="text-sm text-muted-foreground mt-2">
                  Primero necesitas crear un menú.
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {restaurant.events.map((event) => {
              const respondedCount = event.guests.length;
              const pendingCount = Math.max(
                0,
                event.guestCount - respondedCount
              );

              return (
                <Link
                  key={event.id}
                  href={`/restaurant/${restaurantId}/event/${event.id}`}
                >
                  <Card className="hover:border-primary/30 transition-colors cursor-pointer">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{event.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(event.date).toLocaleDateString("es-ES", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                          <div className="flex items-start gap-2 mt-1">
                            <Users className="h-3 w-3 text-muted-foreground mt-0.5" />
                            <div className="text-xs text-muted-foreground">
                              <div>
                                {respondedCount} / {event.guestCount} respuestas recibidas
                              </div>
                              <div>{pendingCount} pendientes</div>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              &middot; {event.menu.name}
                            </span>
                          </div>
                        </div>
                        <Badge
                          variant={
                            event.status === "open" ? "default" : "secondary"
                          }
                        >
                          {event.status === "open" ? "Abierto" : "Cerrado"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
