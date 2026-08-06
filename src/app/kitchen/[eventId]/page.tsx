"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { AlertTriangle, ChefHat, ShieldCheck } from "lucide-react";
import { getKitchenEvent } from "@/lib/actions/event";
import { getAllergenById } from "@/lib/allergens";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type KitchenEvent = NonNullable<Awaited<ReturnType<typeof getKitchenEvent>>>;

export default function KitchenEventPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const eventId = params.eventId as string;
  const token = searchParams.get("token") || "";
  const [event, setEvent] = useState<KitchenEvent | null>(null);
  const [loading, setLoading] = useState(true);

  const loadEvent = useCallback(async () => {
    const data = await getKitchenEvent(eventId, token);
    setEvent(data);
    setLoading(false);
  }, [eventId, token]);

  useEffect(() => {
    const initialTimer = window.setTimeout(loadEvent, 0);
    const timer = window.setInterval(loadEvent, 15_000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [loadEvent]);

  if (loading) {
    return <p className="py-20 text-center text-muted-foreground">Cargando cocina…</p>;
  }

  if (!event) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center px-4">
        <Card className="w-full text-center">
          <CardContent className="py-10">
            <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <h1 className="font-semibold">Enlace de cocina no válido</h1>
            <p className="mt-2 text-sm text-muted-foreground">Solicita un enlace nuevo al responsable del restaurante.</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <ChefHat className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Cocina · {event.name}</h1>
          </div>
          <p className="text-sm text-muted-foreground">{event.menuName} · {event.respondedCount}/{event.guestCount} respuestas</p>
        </div>
        <div className="flex max-w-md items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Acceso restringido: sin nombres, contactos ni entrada al panel de gestión.</span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader><CardTitle>Producción</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            {event.courses.map((course) => (
              <section key={course.id}>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{course.name}</h2>
                <div className="space-y-1.5">
                  {course.dishes.slice().sort((a, b) => b.selections - a.selections).map((dish) => (
                    <div key={dish.id} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                      <div>
                        <span className="font-medium">{dish.name}</span>
                        {dish.isShared && dish.sharesFor && <span className="ml-2 text-xs text-muted-foreground">compartir/{dish.sharesFor}p</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        {dish.isShared && <span className="text-xs text-muted-foreground">{dish.selections} sel.</span>}
                        <Badge variant={dish.portions > 0 ? "default" : "outline"}>{dish.portions}{dish.isShared ? " rac." : ""}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </CardContent>
        </Card>

        <Card className={event.dietaryInstructions.length > 0 ? "border-amber-300" : ""}>
          <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-600" />Indicaciones alimentarias</CardTitle></CardHeader>
          <CardContent>
            {event.dietaryInstructions.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No hay indicaciones declaradas.</p>
            ) : (
              <div className="space-y-3">
                {event.dietaryInstructions.map((guest) => (
                  <section key={guest.serviceCode} className="space-y-2 rounded-lg border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong className="font-mono text-sm">{guest.serviceCode}</strong>
                      <div className="flex flex-wrap gap-1">
                        {guest.allergens.map((id) => {
                          const allergen = getAllergenById(id);
                          return <Badge key={id} variant="warning">{allergen?.emoji} {allergen?.name || id}</Badge>;
                        })}
                      </div>
                    </div>
                    {guest.allergyNotes && <p className="rounded-md bg-amber-50 px-2.5 py-2 text-sm text-amber-950">{guest.allergyNotes}</p>}
                    <ul className="space-y-1 text-sm">
                      {guest.selections.map((selection) => (
                        <li key={selection.id} className="flex flex-wrap items-center justify-between gap-2">
                          <span>{selection.courseName}: {selection.dishName}</span>
                          {selection.conflicts.length > 0 && (
                            <Badge variant="destructive">Riesgo: {selection.conflicts.map((id) => getAllergenById(id)?.name || id).join(", ")}</Badge>
                          )}
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
