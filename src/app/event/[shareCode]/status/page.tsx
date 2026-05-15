"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getEventByShareCode } from "@/lib/actions/event";
import { getAllergenById, parseAllergenIds } from "@/lib/allergens";
import {
  UtensilsCrossed,
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  Clock,
  RefreshCw,
} from "lucide-react";

type EventData = NonNullable<Awaited<ReturnType<typeof getEventByShareCode>>>;

export default function OrganizerStatusPage() {
  const params = useParams();
  const shareCode = params.shareCode as string;

  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const loadEvent = useCallback(async () => {
    const data = await getEventByShareCode(shareCode);
    if (data) {
      setEvent(data);
    } else {
      setNotFound(true);
    }
    setLoading(false);
  }, [shareCode]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  const refresh = () => {
    setLoading(true);
    loadEvent();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="py-8">
            <UtensilsCrossed className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Evento no encontrado</h2>
            <p className="text-muted-foreground text-sm">
              El código de invitación no es válido.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const respondedCount = event.guests.length;
  const pendingCount = Math.max(0, event.guestCount - respondedCount);
  const progress =
    event.guestCount > 0
      ? Math.round((respondedCount / event.guestCount) * 100)
      : 100;

  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <UtensilsCrossed className="h-8 w-8 text-primary mx-auto mb-2" />
        <h1 className="text-2xl font-bold">{event.name}</h1>
        <div className="flex flex-col items-center gap-1 mt-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {event.restaurant.name}
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(event.date).toLocaleDateString("es-ES", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </div>
        </div>
        <Badge
          variant={event.status === "open" ? "default" : "secondary"}
          className="mt-2"
        >
          {event.status === "open" ? "Abierto" : "Cerrado"}
        </Badge>
      </div>

      {/* Progress */}
      <Card className="mb-4">
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="font-semibold">Respuestas</span>
            </div>
            <span className="text-lg font-bold">
              {respondedCount} / {event.guestCount} respuestas recibidas
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div
              className="bg-primary rounded-full h-3 transition-all"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
            <span>Avance del evento</span>
            <span>{pendingCount} pendientes</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end mb-4">
        <Button variant="outline" size="sm" onClick={refresh}>
          <RefreshCw className="h-3.5 w-3.5 mr-1" />
          Actualizar
        </Button>
      </div>

      {/* Guest List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invitados que han respondido</CardTitle>
        </CardHeader>
        <CardContent>
          {event.guests.length === 0 ? (
            <div className="text-center py-6">
              <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                Aún no hay respuestas. Comparte el enlace con tus invitados.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {event.guests.map((guest) => {
                const guestAllergens = parseAllergenIds(guest.allergens);
                return (
                  <div
                    key={guest.id}
                    className="border rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-secondary shrink-0" />
                      <span className="font-medium">{guest.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(guest.submittedAt).toLocaleString("es-ES", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="pl-6 space-y-1">
                      {guest.selections.map((sel) => (
                        <div key={sel.id} className="text-sm text-muted-foreground">
                          {sel.dish.name}
                        </div>
                      ))}
                      {guestAllergens.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {guestAllergens.map((a) => {
                            const al = getAllergenById(a);
                            return (
                              <Badge
                                key={a}
                                variant="warning"
                                className="text-xs"
                              >
                                {al?.emoji} {al?.name}
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
