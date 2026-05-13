"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getEventByShareCode } from "@/lib/actions/event";
import { submitGuestSelection } from "@/lib/actions/guest";
import { EU_ALLERGENS, getAllergenById } from "@/lib/allergens";
import {
  UtensilsCrossed,
  Calendar,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Users,
  Clock,
} from "lucide-react";

type EventData = NonNullable<Awaited<ReturnType<typeof getEventByShareCode>>>;

export default function GuestPage() {
  const params = useParams();
  const shareCode = params.shareCode as string;

  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Form state
  const [guestName, setGuestName] = useState("");
  const [selectedDishes, setSelectedDishes] = useState<Record<string, string>>(
    {}
  );
  const [guestAllergens, setGuestAllergens] = useState<string[]>([]);
  const [allergyNotes, setAllergyNotes] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Allergen warning dialog
  const [warningDialog, setWarningDialog] = useState<{
    open: boolean;
    dishName: string;
    courseId: string;
    dishId: string;
    allergenNames: string[];
  }>({
    open: false,
    dishName: "",
    courseId: "",
    dishId: "",
    allergenNames: [],
  });

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

  const toggleAllergen = (allergenId: string) => {
    setGuestAllergens((prev) =>
      prev.includes(allergenId)
        ? prev.filter((a) => a !== allergenId)
        : [...prev, allergenId]
    );
  };

  const handleDishSelect = (courseId: string, dishId: string) => {
    if (!event) return;

    // Find the dish
    let dishName = "";
    let dishAllergens: string[] = [];
    for (const course of event.menu.courses) {
      for (const dish of course.dishes) {
        if (dish.id === dishId) {
          dishName = dish.name;
          dishAllergens = JSON.parse(dish.allergens) as string[];
          break;
        }
      }
    }

    // Check if this dish has allergens the guest declared
    const conflicts = guestAllergens.filter((a) =>
      dishAllergens.includes(a)
    );

    if (conflicts.length > 0) {
      const conflictNames = conflicts
        .map((c) => getAllergenById(c)?.name || c);
      setWarningDialog({
        open: true,
        dishName,
        courseId,
        dishId,
        allergenNames: conflictNames.filter((n): n is string => !!n),
      });
    } else {
      setSelectedDishes((prev) => ({ ...prev, [courseId]: dishId }));
    }
  };

  const confirmDishSelection = () => {
    setSelectedDishes((prev) => ({
      ...prev,
      [warningDialog.courseId]: warningDialog.dishId,
    }));
    setWarningDialog((prev) => ({ ...prev, open: false }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!guestName.trim()) {
      setError("Por favor, escribe tu nombre");
      return;
    }

    if (!event) return;

    const courseIds = event.menu.courses.map((c) => c.id);
    const missingCourses = courseIds.filter((id) => !selectedDishes[id]);
    if (missingCourses.length > 0) {
      const missingNames = missingCourses
        .map((id) => event.menu.courses.find((c) => c.id === id)?.name)
        .join(", ");
      setError(`Selecciona un plato para: ${missingNames}`);
      return;
    }

    setSubmitting(true);

    const selections = Object.values(selectedDishes).map((dishId) => ({
      dishId,
    }));

    const result = await submitGuestSelection({
      eventId: event.id,
      name: guestName.trim(),
      allergens: guestAllergens,
      allergyNotes: allergyNotes.trim() || undefined,
      selections,
    });

    if (result.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <UtensilsCrossed className="h-8 w-8 text-primary mx-auto mb-3 animate-pulse" />
          <p className="text-muted-foreground">Cargando menú...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="py-8">
            <UtensilsCrossed className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Evento no encontrado</h2>
            <p className="text-muted-foreground text-sm">
              El código de invitación no es válido. Verifica que el enlace sea
              correcto.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!event) return null;

  const deadlinePassed =
    event.votingDeadline && new Date() > new Date(event.votingDeadline);

  if (event.status === "closed" || deadlinePassed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="py-8">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Votaciones cerradas</h2>
            <p className="text-muted-foreground text-sm">
              {deadlinePassed && event.votingDeadline
                ? `El plazo para votar finalizó el ${new Date(event.votingDeadline).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}.`
                : "Este evento ya no acepta respuestas."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="py-8">
            <CheckCircle2 className="h-16 w-16 text-secondary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">
              ¡Listo, {guestName.trim()}!
            </h2>
            <p className="text-muted-foreground">
              Tu selección ha sido registrada.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto">
      {/* Event header */}
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
          <div className="text-xs">{event.menu.name}</div>
          {event.votingDeadline && (
            <div className="flex items-center gap-1 text-xs font-medium text-amber-600 mt-1">
              <Clock className="h-3.5 w-3.5" />
              Vota antes del{" "}
              {new Date(event.votingDeadline).toLocaleDateString("es-ES", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <Card>
          <CardContent className="pt-5">
            <Label htmlFor="guestName" className="text-base font-semibold">
              Tu nombre
            </Label>
            <Input
              id="guestName"
              placeholder="Escribe tu nombre"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="mt-2 text-base h-12"
              required
            />
          </CardContent>
        </Card>

        {/* Allergens (before dishes so warnings work) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              ¿Tienes alguna alergia o intolerancia?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {EU_ALLERGENS.map((allergen) => (
                <label
                  key={allergen.id}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                    guestAllergens.includes(allergen.id)
                      ? "bg-orange-50 border-orange-300"
                      : "bg-background border-border hover:border-primary/30"
                  }`}
                >
                  <Checkbox
                    checked={guestAllergens.includes(allergen.id)}
                    onCheckedChange={() => toggleAllergen(allergen.id)}
                  />
                  <span className="text-sm">
                    {allergen.emoji} {allergen.name}
                  </span>
                </label>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="allergyNotes" className="text-sm">
                Notas adicionales (opcional)
              </Label>
              <Textarea
                id="allergyNotes"
                placeholder="Ej: Intolerancia severa a frutos secos"
                value={allergyNotes}
                onChange={(e) => setAllergyNotes(e.target.value)}
                rows={2}
                className="text-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Dishes by course */}
        {event.menu.courses.map((course) => (
          <Card key={course.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {course.name}
                {selectedDishes[course.id] && (
                  <CheckCircle2 className="h-4 w-4 text-secondary" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={selectedDishes[course.id] || ""}
                onValueChange={(value) =>
                  handleDishSelect(course.id, value)
                }
                className="space-y-2"
              >
                {course.dishes.map((dish) => {
                  const dishAllergens = JSON.parse(
                    dish.allergens
                  ) as string[];
                  const hasConflict = guestAllergens.some((a) =>
                    dishAllergens.includes(a)
                  );
                  const conflictAllergens = guestAllergens
                    .filter((a) => dishAllergens.includes(a))
                    .map((a) => getAllergenById(a)?.name || a);

                  return (
                    <label
                      key={dish.id}
                      className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-colors ${
                        selectedDishes[course.id] === dish.id
                          ? "bg-primary/5 border-primary"
                          : hasConflict
                          ? "bg-orange-50/50 border-orange-200"
                          : "bg-background border-border hover:border-primary/30"
                      }`}
                    >
                      <RadioGroupItem
                        value={dish.id}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-base">{dish.name}</span>
                          {dish.isShared && dish.sharesFor && (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              <Users className="h-3 w-3" />
                              Para compartir ({dish.sharesFor}p)
                            </span>
                          )}
                        </div>
                        {dish.description && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {dish.description}
                          </p>
                        )}
                        {hasConflict && (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />
                            <span className="text-xs text-orange-700 font-medium">
                              Contiene: {conflictAllergens.join(", ")}
                            </span>
                          </div>
                        )}
                        {dishAllergens.length > 0 && !hasConflict && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {dishAllergens.map((a) => {
                              const al = getAllergenById(a);
                              return (
                                <Badge
                                  key={a}
                                  variant="outline"
                                  className="text-xs px-1.5 py-0"
                                >
                                  {al?.emoji} {al?.name}
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </RadioGroup>
            </CardContent>
          </Card>
        ))}

        {/* Error */}
        {error && (
          <p className="text-sm text-destructive font-medium text-center">
            {error}
          </p>
        )}

        {/* Submit */}
        <Button
          type="submit"
          size="lg"
          className="w-full text-lg h-14"
          disabled={submitting}
        >
          {submitting ? "Enviando..." : "Confirmar selección"}
        </Button>
      </form>

      {/* Allergen warning dialog */}
      <AlertDialog
        open={warningDialog.open}
        onOpenChange={(open) =>
          setWarningDialog((prev) => ({ ...prev, open }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Aviso de alérgenos
            </AlertDialogTitle>
            <AlertDialogDescription>
              El plato &quot;{warningDialog.dishName}&quot; contiene{" "}
              <strong>{warningDialog.allergenNames.join(", ")}</strong> que has
              marcado como alérgeno. ¿Estás seguro de que quieres
              seleccionarlo?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDishSelection}>
              Sí, seleccionar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
