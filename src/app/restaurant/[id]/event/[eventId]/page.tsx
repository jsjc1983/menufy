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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getEventById, closeEvent } from "@/lib/actions/event";
import { getAllergenById } from "@/lib/allergens";
import {
  ArrowLeft,
  Download,
  Lock,
  Users,
  AlertTriangle,
  ChefHat,
  Copy,
  Check,
} from "lucide-react";
import Link from "next/link";

type EventData = NonNullable<Awaited<ReturnType<typeof getEventById>>>;

export default function EventDashboard() {
  const params = useParams();
  const restaurantId = params.id as string;
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const loadEvent = useCallback(async () => {
    const data = await getEventById(eventId);
    if (data) setEvent(data);
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  const handleClose = async () => {
    await closeEvent(eventId);
    loadEvent();
  };

  const copyShareLink = async () => {
    if (!event) return;
    const link = `${window.location.origin}/event/${event.shareCode}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportSummary = () => {
    if (!event) return;

    const lines: string[] = [];
    lines.push("=".repeat(50));
    lines.push(`MENUFY - RESUMEN DEL EVENTO`);
    lines.push("=".repeat(50));
    lines.push("");
    lines.push(`Evento: ${event.name}`);
    lines.push(
      `Fecha: ${new Date(event.date).toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })}`
    );
    lines.push(`Restaurante: ${event.restaurant.name}`);
    lines.push(`Menú: ${event.menu.name}`);
    lines.push(`Comensales: ${event.guests.length}/${event.guestCount}`);
    lines.push(`Organizador: ${event.organizerName}`);
    lines.push("");

    // Production summary
    lines.push("-".repeat(50));
    lines.push("RESUMEN DE PRODUCCIÓN");
    lines.push("-".repeat(50));
    for (const course of event.menu.courses) {
      lines.push("");
      lines.push(`  ${course.name.toUpperCase()}`);
      const dishCounts: Record<string, number> = {};
      for (const guest of event.guests) {
        for (const sel of guest.selections) {
          if (sel.dish.course?.id === course.id) {
            dishCounts[sel.dish.name] = (dishCounts[sel.dish.name] || 0) + 1;
          }
        }
      }
      for (const [dishName, count] of Object.entries(dishCounts).sort(
        (a, b) => b[1] - a[1]
      )) {
        lines.push(`    ${dishName}: ${count}`);
      }
    }

    // Allergens
    lines.push("");
    lines.push("-".repeat(50));
    lines.push("ALÉRGENOS");
    lines.push("-".repeat(50));
    const guestsWithAllergens = event.guests.filter((g) => {
      const allergens = JSON.parse(g.allergens) as string[];
      return allergens.length > 0 || g.allergyNotes;
    });
    if (guestsWithAllergens.length === 0) {
      lines.push("  Ningún comensal ha declarado alérgenos.");
    } else {
      for (const guest of guestsWithAllergens) {
        const allergens = JSON.parse(guest.allergens) as string[];
        const allergenNames = allergens
          .map((a) => getAllergenById(a)?.name || a)
          .join(", ");
        lines.push("");
        lines.push(`  ${guest.name}`);
        if (allergenNames) lines.push(`    Alérgenos: ${allergenNames}`);
        if (guest.allergyNotes) lines.push(`    Notas: ${guest.allergyNotes}`);

        // Check for conflicts
        for (const sel of guest.selections) {
          const dishAllergens = JSON.parse(sel.dish.allergens) as string[];
          const conflicts = allergens.filter((a) =>
            dishAllergens.includes(a)
          );
          if (conflicts.length > 0) {
            const conflictNames = conflicts
              .map((a) => getAllergenById(a)?.name || a)
              .join(", ");
            lines.push(
              `    ⚠️ ALERTA: Ha elegido "${sel.dish.name}" que contiene: ${conflictNames}`
            );
          }
        }
      }
    }

    // Guest list
    lines.push("");
    lines.push("-".repeat(50));
    lines.push("LISTA COMPLETA DE INVITADOS");
    lines.push("-".repeat(50));
    for (const guest of event.guests) {
      const allergens = JSON.parse(guest.allergens) as string[];
      lines.push("");
      lines.push(`  ${guest.name}`);
      for (const sel of guest.selections) {
        const courseName = sel.dish.course?.name || "";
        lines.push(`    ${courseName}: ${sel.dish.name}`);
      }
      if (allergens.length > 0) {
        const allergenNames = allergens
          .map((a) => getAllergenById(a)?.name || a)
          .join(", ");
        lines.push(`    Alérgenos: ${allergenNames}`);
      }
      if (guest.allergyNotes) {
        lines.push(`    Notas: ${guest.allergyNotes}`);
      }
    }

    lines.push("");
    lines.push("=".repeat(50));
    lines.push(`Generado por Menufy - ${new Date().toLocaleString("es-ES")}`);

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `menufy-${event.name.replace(/\s+/g, "-").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Evento no encontrado</p>
      </div>
    );
  }

  // Compute dish counts per course
  const dishCountsByCourse: Record<
    string,
    { courseName: string; dishes: Record<string, number> }
  > = {};
  for (const course of event.menu.courses) {
    dishCountsByCourse[course.id] = { courseName: course.name, dishes: {} };
    for (const dish of course.dishes) {
      dishCountsByCourse[course.id].dishes[dish.name] = 0;
    }
  }
  for (const guest of event.guests) {
    for (const sel of guest.selections) {
      const courseId = sel.dish.course?.id;
      if (courseId && dishCountsByCourse[courseId]) {
        dishCountsByCourse[courseId].dishes[sel.dish.name] =
          (dishCountsByCourse[courseId].dishes[sel.dish.name] || 0) + 1;
      }
    }
  }

  // Find allergen conflicts
  const allergenAlerts: {
    guestName: string;
    dishName: string;
    conflicts: string[];
  }[] = [];
  for (const guest of event.guests) {
    const guestAllergens = JSON.parse(guest.allergens) as string[];
    if (guestAllergens.length === 0) continue;
    for (const sel of guest.selections) {
      const dishAllergens = JSON.parse(sel.dish.allergens) as string[];
      const conflicts = guestAllergens.filter((a) =>
        dishAllergens.includes(a)
      );
      if (conflicts.length > 0) {
        allergenAlerts.push({
          guestName: guest.name,
          dishName: sel.dish.name,
          conflicts,
        });
      }
    }
  }

  return (
    <div className="min-h-screen px-4 py-8 max-w-5xl mx-auto">
      <Link
        href={`/restaurant/${restaurantId}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al panel
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold">{event.name}</h1>
            <Badge
              variant={event.status === "open" ? "default" : "secondary"}
            >
              {event.status === "open" ? "Abierto" : "Cerrado"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {new Date(event.date).toLocaleDateString("es-ES", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}{" "}
            &middot; {event.menu.name} &middot; Organizador:{" "}
            {event.organizerName}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {event.guests.length} / {event.guestCount} respuestas
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={copyShareLink}>
            {copied ? (
              <Check className="h-4 w-4 mr-1" />
            ) : (
              <Copy className="h-4 w-4 mr-1" />
            )}
            {copied ? "Copiado" : "Copiar enlace"}
          </Button>
          <Button variant="outline" size="sm" onClick={exportSummary}>
            <Download className="h-4 w-4 mr-1" />
            Exportar resumen
          </Button>
          {event.status === "open" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Lock className="h-4 w-4 mr-1" />
                  Cerrar evento
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cerrar evento</AlertDialogTitle>
                  <AlertDialogDescription>
                    Al cerrar el evento, los invitados ya no podrán enviar
                    sus respuestas. Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClose}>
                    Cerrar evento
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <Tabs defaultValue="production">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="production">Producción</TabsTrigger>
          <TabsTrigger value="allergens">
            Alérgenos
            {allergenAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-1.5 h-5 px-1.5">
                {allergenAlerts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="guests">Invitados</TabsTrigger>
        </TabsList>

        {/* Production Tab */}
        <TabsContent value="production" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5 text-primary" />
                Resumen de producción
              </CardTitle>
            </CardHeader>
            <CardContent>
              {event.guests.length === 0 ? (
                <p className="text-muted-foreground text-center py-6">
                  Aún no hay respuestas de invitados.
                </p>
              ) : (
                <div className="space-y-6">
                  {Object.values(dishCountsByCourse).map((courseData) => (
                    <div key={courseData.courseName}>
                      <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-2">
                        {courseData.courseName}
                      </h3>
                      <div className="space-y-1">
                        {Object.entries(courseData.dishes)
                          .sort((a, b) => b[1] - a[1])
                          .map(([dishName, count]) => (
                            <div
                              key={dishName}
                              className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50"
                            >
                              <span className="font-medium">{dishName}</span>
                              <Badge
                                variant={count > 0 ? "default" : "outline"}
                              >
                                {count}
                              </Badge>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Allergens Tab */}
        <TabsContent value="allergens" className="space-y-4 mt-4">
          {/* Alerts */}
          {allergenAlerts.length > 0 && (
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Alertas de riesgo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {allergenAlerts.map((alert, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 p-3 bg-destructive/5 rounded-md"
                    >
                      <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                      <div className="text-sm">
                        <span className="font-medium">{alert.guestName}</span>{" "}
                        ha elegido &quot;{alert.dishName}&quot; que contiene:{" "}
                        {alert.conflicts
                          .map((c) => getAllergenById(c)?.name || c)
                          .join(", ")}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Guests with allergens */}
          <Card>
            <CardHeader>
              <CardTitle>Comensales con alérgenos</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const guestsWithAllergens = event.guests.filter((g) => {
                  const allergens = JSON.parse(g.allergens) as string[];
                  return allergens.length > 0 || g.allergyNotes;
                });
                if (guestsWithAllergens.length === 0) {
                  return (
                    <p className="text-muted-foreground text-center py-6">
                      Ningún comensal ha declarado alérgenos.
                    </p>
                  );
                }
                return (
                  <div className="space-y-3">
                    {guestsWithAllergens.map((guest) => {
                      const allergens = JSON.parse(
                        guest.allergens
                      ) as string[];
                      return (
                        <div
                          key={guest.id}
                          className="p-3 border rounded-md space-y-1"
                        >
                          <div className="font-medium">{guest.name}</div>
                          <div className="flex flex-wrap gap-1">
                            {allergens.map((a) => {
                              const allergen = getAllergenById(a);
                              return (
                                <Badge
                                  key={a}
                                  variant="warning"
                                  className="text-xs"
                                >
                                  {allergen?.emoji} {allergen?.name || a}
                                </Badge>
                              );
                            })}
                          </div>
                          {guest.allergyNotes && (
                            <p className="text-sm text-muted-foreground">
                              Notas: {guest.allergyNotes}
                            </p>
                          )}
                          <div className="text-xs text-muted-foreground mt-1">
                            Platos:{" "}
                            {guest.selections
                              .map((s) => s.dish.name)
                              .join(", ")}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Guests Tab */}
        <TabsContent value="guests" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Lista completa de invitados ({event.guests.length}/
                {event.guestCount})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {event.guests.length === 0 ? (
                <p className="text-muted-foreground text-center py-6">
                  Aún no hay respuestas de invitados.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 pr-4 font-medium">
                          Nombre
                        </th>
                        {event.menu.courses.map((course) => (
                          <th
                            key={course.id}
                            className="text-left py-2 pr-4 font-medium"
                          >
                            {course.name}
                          </th>
                        ))}
                        <th className="text-left py-2 font-medium">
                          Alérgenos
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {event.guests.map((guest) => {
                        const guestAllergens = JSON.parse(
                          guest.allergens
                        ) as string[];
                        return (
                          <tr key={guest.id} className="border-b last:border-0">
                            <td className="py-2 pr-4 font-medium">
                              {guest.name}
                            </td>
                            {event.menu.courses.map((course) => {
                              const sel = guest.selections.find(
                                (s) => s.dish.course?.id === course.id
                              );
                              return (
                                <td key={course.id} className="py-2 pr-4">
                                  {sel?.dish.name || "-"}
                                </td>
                              );
                            })}
                            <td className="py-2">
                              {guestAllergens.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {guestAllergens.map((a) => {
                                    const al = getAllergenById(a);
                                    return (
                                      <span key={a} className="text-xs">
                                        {al?.emoji}
                                      </span>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
