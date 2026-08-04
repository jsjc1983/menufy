"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { verifyPin, getRestaurant, logoutRestaurant, deleteRestaurant } from "@/lib/actions/restaurant";
import { deleteMenu, updateMenuDetails } from "@/lib/actions/menu";
import {
  UtensilsCrossed,
  Plus,
  Calendar,
  Users,
  ChefHat,
  Lock,
  Trash2,
  Pencil,
} from "lucide-react";
import Link from "next/link";

type RestaurantData = NonNullable<Awaited<ReturnType<typeof getRestaurant>>>;

export default function RestaurantPanel() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params.id as string;

  const [authenticated, setAuthenticated] = useState(false);
  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");

  const loadRestaurant = useCallback(async () => {
    const data = await getRestaurant(restaurantId);
    if (data) {
      setRestaurant(data);
      setAuthenticated(true);
    } else {
      setAuthenticated(false);
    }
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => {
    const timer = window.setTimeout(loadRestaurant, 0);
    return () => window.clearTimeout(timer);
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
    setAuthenticated(true);
    setLoading(true);
    loadRestaurant();
  };

  const handleLogout = async () => {
    await logoutRestaurant();
    setRestaurant(null);
    setAuthenticated(false);
    setPin("");
  };

  const handleDeleteMenu = async (menuId: string) => {
    if (!window.confirm("¿Eliminar este menú? Solo es posible si no está asociado a eventos.")) return;
    setActionError("");
    const result = await deleteMenu(menuId, restaurantId);
    if (result.error) setActionError(result.error);
    else await loadRestaurant();
  };

  const handleRenameMenu = async (menu: RestaurantData["menus"][number]) => {
    const name = window.prompt("Nombre del menú", menu.name);
    if (name === null || name.trim() === menu.name) return;
    setActionError("");
    const result = await updateMenuDetails(menu.id, restaurantId, {
      name,
      description: menu.description ?? undefined,
    });
    if (result.error) setActionError(result.error);
    else await loadRestaurant();
  };

  const handleDeleteRestaurant = async () => {
    if (!restaurant) return;
    const confirmation = window.prompt(
      `Esta acción elimina permanentemente restaurante, menús, eventos y respuestas. Escribe exactamente: ${restaurant.name}`
    );
    if (confirmation === null) return;
    setActionError("");
    const result = await deleteRestaurant(restaurantId, confirmation);
    if (result.error) setActionError(result.error);
    else router.push("/");
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
        <div className="flex gap-2">
          <Link href="/">
            <Button variant="ghost" size="sm">Inicio</Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Cerrar sesión
          </Button>
        </div>
      </div>

      {actionError && (
        <p className="mb-4 text-sm font-medium text-destructive">{actionError}</p>
      )}

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
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{menu.courses.length} tiempos</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Renombrar ${menu.name}`}
                        onClick={() => handleRenameMenu(menu)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Eliminar ${menu.name}`}
                        onClick={() => handleDeleteMenu(menu.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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

      <Separator className="my-8" />
      <div className="rounded-lg border border-destructive/30 p-4">
        <h2 className="font-semibold">Eliminar cuenta y datos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Borra permanentemente el restaurante, sus menús, eventos y respuestas de invitados.
        </p>
        <Button variant="destructive" size="sm" className="mt-3" onClick={handleDeleteRestaurant}>
          <Trash2 className="mr-1 h-4 w-4" /> Eliminar restaurante
        </Button>
      </div>
    </div>
  );
}
