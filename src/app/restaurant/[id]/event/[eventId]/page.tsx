"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { getEventById, closeEvent, deleteEvent, getOrCreateKitchenToken, reopenEvent, renameEvent } from "@/lib/actions/event";
import {
  deleteGuest,
  updateGuestSelection,
  createGuestManually,
} from "@/lib/actions/guest";
import { EU_ALLERGENS, getAllergenById, parseAllergenIds } from "@/lib/allergens";
import { generateEventSummary, eventSummaryFilename } from "@/lib/export/event-summary";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Download,
  Lock,
  Users,
  AlertTriangle,
  ChefHat,
  Copy,
  Check,
  Clock,
  Pencil,
  Trash2,
  Plus,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

type EventData = NonNullable<Awaited<ReturnType<typeof getEventById>>>;

export default function EventDashboard() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params.id as string;
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedOrganizer, setCopiedOrganizer] = useState(false);
  const [copiedKitchen, setCopiedKitchen] = useState(false);
  const [authError, setAuthError] = useState("");
  const [actionError, setActionError] = useState("");
  const [guestFormOpen, setGuestFormOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<EventData["guests"][0] | null>(null);
  const [deletingGuestId, setDeletingGuestId] = useState<string | null>(null);

  const loadEvent = useCallback(async () => {
    const data = await getEventById(eventId, restaurantId);
    if (data) {
      setEvent(data);
    } else {
      setAuthError("Evento no encontrado o PIN no válido.");
    }
    setLoading(false);
  }, [eventId, restaurantId]);

  useEffect(() => {
    const initialTimer = window.setTimeout(loadEvent, 0);
    const timer = window.setInterval(loadEvent, 15_000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [restaurantId, loadEvent]);

  const handleClose = async () => {
    setActionError("");
    const result = await closeEvent(eventId, restaurantId);
    if (result.error) {
      setActionError(result.error);
      return;
    }
    loadEvent();
  };

  const handleReopen = async () => {
    setActionError("");
    const result = await reopenEvent(eventId, restaurantId);
    if (result.error) setActionError(result.error);
    else loadEvent();
  };

  const handleDeleteEvent = async () => {
    if (!window.confirm("¿Eliminar definitivamente este evento vacío?")) return;
    setActionError("");
    const result = await deleteEvent(eventId, restaurantId);
    if (result.error) setActionError(result.error);
    else router.push(`/restaurant/${restaurantId}`);
  };

  const handleRenameEvent = async () => {
    if (!event) return;
    const name = window.prompt("Nombre del evento", event.name);
    if (name === null || name.trim() === event.name) return;
    setActionError("");
    const result = await renameEvent(eventId, restaurantId, name);
    if (result.error) setActionError(result.error);
    else loadEvent();
  };

  const copyShareLink = async () => {
    if (!event) return;
    const link = `${window.location.origin}/event/${event.shareCode}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyOrganizerLink = async () => {
    if (!event) return;
    const link = `${window.location.origin}/event/${event.shareCode}/status?token=${encodeURIComponent(event.organizerToken)}`;
    await navigator.clipboard.writeText(link);
    setCopiedOrganizer(true);
    setTimeout(() => setCopiedOrganizer(false), 2000);
  };

  const copyKitchenLink = async () => {
    const result = await getOrCreateKitchenToken(eventId, restaurantId);
    if (result.error || !result.token) {
      setActionError(result.error || "No se pudo crear el enlace de cocina");
      return;
    }
    const link = `${window.location.origin}/kitchen/${eventId}?token=${encodeURIComponent(result.token)}`;
    await navigator.clipboard.writeText(link);
    setCopiedKitchen(true);
    window.setTimeout(() => setCopiedKitchen(false), 2000);
  };

  const handleDeleteGuest = async (guestId: string) => {
    setActionError("");
    const result = await deleteGuest(guestId, eventId, restaurantId);
    if (result.error) {
      setActionError(result.error);
    } else {
      loadEvent();
    }
    setDeletingGuestId(null);
  };

  const exportSummary = () => {
    if (!event) return;
    const content = generateEventSummary(event);
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = eventSummaryFilename(event);
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
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="py-8">
            <p className="text-muted-foreground mb-4">
              {authError || "Evento no encontrado"}
            </p>
            <Link href={`/restaurant/${restaurantId}`}>
              <Button>Ir al panel</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Compute dish counts per course
  type DishStat = { count: number; isShared: boolean; sharesFor: number | null };
  const dishCountsByCourse: Record<
    string,
    { courseName: string; dishes: Record<string, DishStat> }
  > = {};
  for (const course of event.menu.courses) {
    dishCountsByCourse[course.id] = { courseName: course.name, dishes: {} };
    for (const dish of course.dishes) {
      dishCountsByCourse[course.id].dishes[dish.name] = {
        count: 0,
        isShared: dish.isShared,
        sharesFor: dish.sharesFor,
      };
    }
  }
  for (const guest of event.guests) {
    for (const sel of guest.selections) {
      const courseId = sel.dish.course?.id;
      if (courseId && dishCountsByCourse[courseId]) {
        const stat = dishCountsByCourse[courseId].dishes[sel.dish.name];
        if (stat) stat.count += 1;
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
    const guestAllergens = parseAllergenIds(guest.allergens);
    if (guestAllergens.length === 0) continue;
    for (const sel of guest.selections) {
      const dishAllergens = parseAllergenIds(sel.dish.allergens);
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

  const respondedCount = event.guests.length;
  const pendingCount = Math.max(0, event.guestCount - respondedCount);

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
          <div className="mt-2 space-y-0.5">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {respondedCount} / {event.guestCount} respuestas recibidas
              </span>
            </div>
            <div className="pl-6 text-sm text-muted-foreground">
              {pendingCount} pendientes
            </div>
          </div>
          {event.votingDeadline && (
            <div className="flex items-center gap-1.5 mt-1 text-sm text-amber-600">
              <Clock className="h-4 w-4" />
              <span>
                Votaciones hasta el{" "}
                <span className="font-medium">
                  {new Date(event.votingDeadline).toLocaleDateString("es-ES", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </span>
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="default" size="sm" onClick={copyKitchenLink}>
            {copiedKitchen ? <Check className="h-4 w-4 mr-1" /> : <ChefHat className="h-4 w-4 mr-1" />}
            {copiedKitchen ? "Enlace copiado" : "Copiar enlace cocina"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleRenameEvent}>
            <Pencil className="h-4 w-4 mr-1" />
            Renombrar
          </Button>
          <Button variant="outline" size="sm" onClick={copyShareLink}>
            {copied ? (
              <Check className="h-4 w-4 mr-1" />
            ) : (
              <Copy className="h-4 w-4 mr-1" />
            )}
            {copied ? "Copiado" : "Copiar enlace"}
          </Button>
          <Button variant="outline" size="sm" onClick={copyOrganizerLink}>
            <Copy className="h-4 w-4 mr-1" />
            {copiedOrganizer ? "Seguimiento copiado" : "Enlace privado de seguimiento"}
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
                    sus respuestas. Podrás reabrirlo mientras el plazo de votación siga vigente.
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
          {event.status === "closed" && (
            <Button variant="outline" size="sm" onClick={handleReopen}>
              Reabrir evento
            </Button>
          )}
          {event.guests.length === 0 && (
            <Button variant="ghost" size="sm" onClick={handleDeleteEvent}>
              <Trash2 className="h-4 w-4 mr-1" />
              Eliminar
            </Button>
          )}
        </div>
      </div>

      {actionError && (
        <p className="text-sm text-destructive font-medium mb-4">
          {actionError}
        </p>
      )}

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
          <TabsTrigger value="pending">
            Pendientes
            {pendingCount > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-5 px-1.5">
                {pendingCount}
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
                          .sort((a, b) => b[1].count - a[1].count)
                          .map(([dishName, stat]) => {
                            const portions =
                              stat.isShared && stat.sharesFor
                                ? Math.ceil(stat.count / stat.sharesFor)
                                : null;
                            return (
                              <div
                                key={dishName}
                                className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{dishName}</span>
                                  {stat.isShared && stat.sharesFor && (
                                    <span className="text-xs text-muted-foreground">
                                      (compartir/{stat.sharesFor}p)
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {portions !== null ? (
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs text-muted-foreground">
                                        {stat.count} sel. →
                                      </span>
                                      <Badge variant="default">
                                        {portions} rac.
                                      </Badge>
                                    </div>
                                  ) : (
                                    <Badge
                                      variant={stat.count > 0 ? "default" : "outline"}
                                    >
                                      {stat.count}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            );
                          })}
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
                  const allergens = parseAllergenIds(g.allergens);
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
                      const allergens = parseAllergenIds(guest.allergens);
                      return (
                        <div
                          key={guest.id}
                          className="space-y-3 rounded-md border p-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="min-w-0 font-medium">{guest.name}</div>
                            <div className="flex flex-wrap justify-end gap-1">
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
                          </div>
                          {guest.allergyNotes && (
                            <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                              <AlertTriangle
                                className="mt-0.5 h-4 w-4 shrink-0 text-amber-700"
                                aria-hidden="true"
                              />
                              <p>{guest.allergyNotes}</p>
                            </div>
                          )}
                          {guest.selections.length > 0 && (
                            <ul className="flex flex-wrap gap-1.5">
                              {guest.selections.map((selection) => (
                                <li
                                  key={selection.id}
                                  className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                                >
                                  {selection.dish.name}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Tab */}
        <TabsContent value="pending" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-baseline justify-around text-center">
                <div>
                  <div className="text-4xl font-bold">{respondedCount}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    respuestas recibidas
                  </div>
                </div>
                <div className="text-2xl text-muted-foreground">/</div>
                <div>
                  <div className="text-4xl font-bold text-muted-foreground">
                    {event.guestCount}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">esperados</div>
                </div>
              </div>
              <progress
                value={respondedCount}
                max={event.guestCount || 1}
                className="w-full h-2.5 rounded-full [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-primary"
              />
              {pendingCount === 0 ? (
                <p className="text-sm text-center font-medium text-green-600">
                  0 pendientes
                </p>
              ) : (
                <p className="text-sm text-muted-foreground text-center">
                  {pendingCount} pendientes
                </p>
              )}
            </CardContent>
          </Card>

          {event.status === "open" && pendingCount > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recordar a los invitados</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Comparte este enlace con quienes aún no han respondido:
                </p>
                <Button onClick={copyShareLink} variant="outline" className="w-full">
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-1.5" />
                      Enlace copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1.5" />
                      Copiar enlace de invitación
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {event.guests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Han respondido</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  {event.guests.map((guest) => (
                    <div
                      key={guest.id}
                      className="flex items-center gap-2.5 py-2 border-b last:border-0"
                    >
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      <span className="text-sm font-medium">{guest.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Guests Tab */}
        <TabsContent value="guests" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Invitados ({event.guests.length}/{event.guestCount})
                </CardTitle>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingGuest(null);
                    setGuestFormOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Añadir
                </Button>
              </div>
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
                        <th className="py-2" aria-label="Acciones"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {event.guests.map((guest) => {
                        const guestAllergens = parseAllergenIds(
                          guest.allergens
                        );
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
                            <td className="py-2 pl-2">
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => {
                                    setEditingGuest(guest);
                                    setGuestFormOpen(true);
                                  }}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                  onClick={() => setDeletingGuestId(guest.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
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

      <AlertDialog
        open={!!deletingGuestId}
        onOpenChange={(open) => { if (!open) setDeletingGuestId(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar invitado?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán sus datos y todas sus selecciones. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletingGuestId && handleDeleteGuest(deletingGuestId)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <GuestFormDialog
        open={guestFormOpen}
        onOpenChange={setGuestFormOpen}
        guest={editingGuest}
        event={event}
        onSaved={loadEvent}
      />
    </div>
  );
}

function GuestFormDialog({
  open,
  onOpenChange,
  guest,
  event,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guest: EventData["guests"][0] | null;
  event: EventData;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [allergyNotes, setAllergyNotes] = useState("");
  const [dishSelections, setDishSelections] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    // This form intentionally resets whenever a different guest is opened.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(guest?.name ?? "");
    setSelectedAllergens(guest ? parseAllergenIds(guest.allergens) : []);
    setAllergyNotes(guest?.allergyNotes ?? "");
    const map: Record<string, string> = {};
    if (guest) {
      for (const sel of guest.selections) {
        const courseId = sel.dish.course?.id;
        if (courseId) map[courseId] = sel.dish.id;
      }
    }
    setDishSelections(map);
    setError("");
    setLoading(false);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleAllergen = (id: string) => {
    setSelectedAllergens((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setError("");
    setLoading(true);

    const selections = event.menu.courses
      .filter((course) => dishSelections[course.id])
      .map((course) => ({ dishId: dishSelections[course.id] }));

    const result = guest
      ? await updateGuestSelection({
          guestId: guest.id,
          eventId: event.id,
          restaurantId: event.restaurant.id,
          name,
          allergens: selectedAllergens,
          allergyNotes: allergyNotes || undefined,
          selections,
        })
      : await createGuestManually({
          eventId: event.id,
          restaurantId: event.restaurant.id,
          name,
          allergens: selectedAllergens,
          allergyNotes: allergyNotes || undefined,
          selections,
        });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {guest ? "Editar invitado" : "Añadir invitado"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="gf-name">Nombre</Label>
            <Input
              id="gf-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del comensal"
            />
          </div>

          {event.menu.courses.map((course) => (
            <div key={course.id} className="space-y-1.5">
              <Label>{course.name}</Label>
              <Select
                value={dishSelections[course.id] ?? ""}
                onValueChange={(val) =>
                  setDishSelections((prev) => ({ ...prev, [course.id]: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar plato..." />
                </SelectTrigger>
                <SelectContent>
                  {course.dishes.map((dish) => (
                    <SelectItem key={dish.id} value={dish.id}>
                      {dish.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}

          <div className="space-y-1.5">
            <Label>Alérgenos</Label>
            <div className="flex flex-wrap gap-1.5">
              {EU_ALLERGENS.map((allergen) => (
                <button
                  key={allergen.id}
                  type="button"
                  onClick={() => toggleAllergen(allergen.id)}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border transition-colors ${
                    selectedAllergens.includes(allergen.id)
                      ? "bg-orange-100 border-orange-300 text-orange-800"
                      : "bg-background border-border text-muted-foreground"
                  }`}
                >
                  {allergen.emoji} {allergen.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="gf-notes">Notas (opcional)</Label>
            <Textarea
              id="gf-notes"
              value={allergyNotes}
              onChange={(e) => setAllergyNotes(e.target.value)}
              placeholder="Notas sobre alergias u otras observaciones..."
              rows={2}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive font-medium">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
