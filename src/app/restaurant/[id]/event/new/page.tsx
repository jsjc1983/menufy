"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getMenusForRestaurant } from "@/lib/actions/menu";
import { createEvent } from "@/lib/actions/event";
import { verifyPin } from "@/lib/actions/restaurant";
import { ArrowLeft, Copy, Check, Link as LinkIcon, Clock } from "lucide-react";
import Link from "next/link";

type MenuList = Awaited<ReturnType<typeof getMenusForRestaurant>>;

export default function NewEventPage() {
  const params = useParams();
  const restaurantId = params.id as string;

  const [menus, setMenus] = useState<MenuList>([]);
  const [adminPin, setAdminPin] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [organizerName, setOrganizerName] = useState("");
  const [organizerEmail, setOrganizerEmail] = useState("");
  const [menuId, setMenuId] = useState("");
  const [daysBeforeClose, setDaysBeforeClose] = useState("3");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdShareCode, setCreatedShareCode] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const storedPin = sessionStorage.getItem(`pin_${restaurantId}`);
    if (!storedPin) {
      setAuthError("Introduce el PIN en el panel del restaurante antes de crear eventos.");
      setAuthLoading(false);
      return;
    }

    verifyPin(restaurantId, storedPin).then(async (result) => {
      if (result.success) {
        setAdminPin(storedPin);
        const restaurantMenus = await getMenusForRestaurant(restaurantId);
        setMenus(restaurantMenus);
      } else {
        sessionStorage.removeItem(`pin_${restaurantId}`);
        setAuthError("Tu sesión ha caducado. Vuelve al panel e introduce el PIN.");
      }
      setAuthLoading(false);
    });
  }, [restaurantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!name.trim()) {
      setError("El nombre del evento es obligatorio");
      setLoading(false);
      return;
    }
    if (!date) {
      setError("La fecha es obligatoria");
      setLoading(false);
      return;
    }
    if (!guestCount || parseInt(guestCount) < 1) {
      setError("El número de comensales debe ser al menos 1");
      setLoading(false);
      return;
    }
    if (!organizerName.trim()) {
      setError("El nombre del organizador es obligatorio");
      setLoading(false);
      return;
    }
    if (!menuId) {
      setError("Debes seleccionar un menú");
      setLoading(false);
      return;
    }
    if (!adminPin) {
      setError("Vuelve al panel e introduce el PIN antes de crear el evento");
      setLoading(false);
      return;
    }

    const result = await createEvent({
      restaurantId,
      name: name.trim(),
      date,
      guestCount: parseInt(guestCount),
      organizerName: organizerName.trim(),
      organizerEmail: organizerEmail.trim() || undefined,
      menuId,
      daysBeforeClose: daysBeforeClose ? parseInt(daysBeforeClose) : undefined,
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (result.event) {
      setCreatedShareCode(result.event.shareCode);
    }
    setLoading(false);
  };

  const votingDeadlinePreview = (() => {
    if (!date || !daysBeforeClose || parseInt(daysBeforeClose) <= 0) return null;
    const d = new Date(date);
    d.setDate(d.getDate() - parseInt(daysBeforeClose));
    return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  })();

  const shareLink = createdShareCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/event/${createdShareCode}`
    : "";

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Comprobando acceso...</p>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="py-8">
            <p className="text-muted-foreground mb-4">{authError}</p>
            <Link href={`/restaurant/${restaurantId}`}>
              <Button>Ir al panel</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (createdShareCode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Evento creado</CardTitle>
            <CardDescription>
              Comparte este enlace con el organizador para que lo reenvíe a
              los invitados.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
              <code className="text-sm flex-1 break-all">{shareLink}</code>
            </div>
            <Button onClick={copyLink} className="w-full" size="lg">
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar enlace
                </>
              )}
            </Button>
            <Separator />
            <div className="text-center text-sm text-muted-foreground">
              <p>
                Enlace del organizador para ver el estado de las respuestas:
              </p>
              <code className="text-xs mt-1 block break-all">
                {shareLink}/status
              </code>
            </div>
            <Link href={`/restaurant/${restaurantId}`} className="block">
              <Button variant="outline" className="w-full">
                Volver al panel
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 max-w-lg mx-auto">
      <Link
        href={`/restaurant/${restaurantId}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al panel
      </Link>

      <h1 className="text-2xl font-bold mb-6">Crear nuevo evento</h1>

      {menus.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">
              Necesitas crear al menos un menú antes de poder crear un evento.
            </p>
            <Link href={`/restaurant/${restaurantId}/menu/new`}>
              <Button>Crear menú</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="eventName">Nombre del evento</Label>
                <Input
                  id="eventName"
                  placeholder="Ej: Cena empresa Navidad 2025"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventDate">Fecha</Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="daysBeforeClose">
                  Días de antelación para cerrar votaciones
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="daysBeforeClose"
                    type="number"
                    min="1"
                    max="30"
                    placeholder="Ej: 5"
                    value={daysBeforeClose}
                    onChange={(e) => setDaysBeforeClose(e.target.value)}
                    className="w-28"
                  />
                  {votingDeadlinePreview && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 shrink-0" />
                      <span>
                        Límite: <span className="font-medium text-foreground">{votingDeadlinePreview}</span>
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Los invitados podrán votar hasta ese número de días antes del evento.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="guestCount">
                  Número de comensales esperados
                </Label>
                <Input
                  id="guestCount"
                  type="number"
                  min="1"
                  placeholder="Ej: 20"
                  value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value)}
                  required
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="organizerName">Nombre del organizador</Label>
                <Input
                  id="organizerName"
                  placeholder="Ej: María García"
                  value={organizerName}
                  onChange={(e) => setOrganizerName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="organizerEmail">
                  Email del organizador (opcional)
                </Label>
                <Input
                  id="organizerEmail"
                  type="email"
                  placeholder="Ej: maria@empresa.com"
                  value={organizerEmail}
                  onChange={(e) => setOrganizerEmail(e.target.value)}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Menú</Label>
                <Select value={menuId} onValueChange={setMenuId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un menú" />
                  </SelectTrigger>
                  <SelectContent>
                    {menus.map((menu) => (
                      <SelectItem key={menu.id} value={menu.id}>
                        {menu.name} ({menu.courses.length} tiempos)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {error && (
            <p className="text-sm text-destructive font-medium">{error}</p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? "Creando..." : "Crear evento"}
          </Button>
        </form>
      )}
    </div>
  );
}

function Separator() {
  return <div className="border-t border-border my-2" />;
}
