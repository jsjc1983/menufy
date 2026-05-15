"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { EU_ALLERGENS } from "@/lib/allergens";
import { createMenu } from "@/lib/actions/menu";
import { verifyPin } from "@/lib/actions/restaurant";
import { Plus, Trash2, ArrowLeft, GripVertical, Users, User } from "lucide-react";
import Link from "next/link";

interface DishForm {
  id: string;
  name: string;
  description: string;
  allergens: string[];
  isShared: boolean;
  sharesFor: string;
}

interface CourseForm {
  id: string;
  name: string;
  dishes: DishForm[];
}

let nextId = 1;
function genId() {
  return `temp_${nextId++}`;
}

export default function NewMenuPage() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params.id as string;

  const [menuName, setMenuName] = useState("");
  const [menuDescription, setMenuDescription] = useState("");
  const [courses, setCourses] = useState<CourseForm[]>([
    {
      id: genId(),
      name: "Entrante",
      dishes: [{ id: genId(), name: "", description: "", allergens: [], isShared: false, sharesFor: "" }],
    },
    {
      id: genId(),
      name: "Principal",
      dishes: [{ id: genId(), name: "", description: "", allergens: [], isShared: false, sharesFor: "" }],
    },
    {
      id: genId(),
      name: "Postre",
      dishes: [{ id: genId(), name: "", description: "", allergens: [], isShared: false, sharesFor: "" }],
    },
  ]);
  const [adminPin, setAdminPin] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedPin = sessionStorage.getItem(`pin_${restaurantId}`);
    if (!storedPin) {
      setAuthError("Introduce el PIN en el panel del restaurante antes de crear menús.");
      setAuthLoading(false);
      return;
    }

    verifyPin(restaurantId, storedPin).then((result) => {
      if (result.success) {
        setAdminPin(storedPin);
      } else {
        sessionStorage.removeItem(`pin_${restaurantId}`);
        setAuthError("Tu sesión ha caducado. Vuelve al panel e introduce el PIN.");
      }
      setAuthLoading(false);
    });
  }, [restaurantId]);

  const addCourse = () => {
    setCourses([
      ...courses,
      {
        id: genId(),
        name: "",
        dishes: [{ id: genId(), name: "", description: "", allergens: [], isShared: false, sharesFor: "" }],
      },
    ]);
  };

  const removeCourse = (courseId: string) => {
    if (courses.length <= 1) return;
    setCourses(courses.filter((c) => c.id !== courseId));
  };

  const updateCourseName = (courseId: string, name: string) => {
    setCourses(
      courses.map((c) => (c.id === courseId ? { ...c, name } : c))
    );
  };

  const addDish = (courseId: string) => {
    setCourses(
      courses.map((c) =>
        c.id === courseId
          ? {
              ...c,
              dishes: [
                ...c.dishes,
                { id: genId(), name: "", description: "", allergens: [], isShared: false, sharesFor: "" },
              ],
            }
          : c
      )
    );
  };

  const removeDish = (courseId: string, dishId: string) => {
    setCourses(
      courses.map((c) =>
        c.id === courseId
          ? {
              ...c,
              dishes:
                c.dishes.length > 1
                  ? c.dishes.filter((d) => d.id !== dishId)
                  : c.dishes,
            }
          : c
      )
    );
  };

  const updateDish = (
    courseId: string,
    dishId: string,
    field: keyof DishForm,
    value: string | string[] | boolean
  ) => {
    setCourses(
      courses.map((c) =>
        c.id === courseId
          ? {
              ...c,
              dishes: c.dishes.map((d) =>
                d.id === dishId ? { ...d, [field]: value } : d
              ),
            }
          : c
      )
    );
  };

  const toggleAllergen = (
    courseId: string,
    dishId: string,
    allergenId: string
  ) => {
    setCourses(
      courses.map((c) =>
        c.id === courseId
          ? {
              ...c,
              dishes: c.dishes.map((d) => {
                if (d.id !== dishId) return d;
                const has = d.allergens.includes(allergenId);
                return {
                  ...d,
                  allergens: has
                    ? d.allergens.filter((a) => a !== allergenId)
                    : [...d.allergens, allergenId],
                };
              }),
            }
          : c
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!menuName.trim()) {
      setError("El nombre del menú es obligatorio");
      setLoading(false);
      return;
    }
    if (!adminPin) {
      setError("Vuelve al panel e introduce el PIN antes de guardar el menú");
      setLoading(false);
      return;
    }

    for (const course of courses) {
      if (!course.name.trim()) {
        setError("Todos los tiempos deben tener nombre");
        setLoading(false);
        return;
      }
      for (const dish of course.dishes) {
        if (!dish.name.trim()) {
          setError(
            `Todos los platos del tiempo "${course.name}" deben tener nombre`
          );
          setLoading(false);
          return;
        }
      }
    }

    const result = await createMenu({
      restaurantId,
      name: menuName.trim(),
      description: menuDescription.trim() || undefined,
      courses: courses.map((c, index) => ({
        name: c.name.trim(),
        order: index,
        dishes: c.dishes.map((d) => ({
          name: d.name.trim(),
          description: d.description.trim() || undefined,
          allergens: d.allergens,
          isShared: d.isShared,
          sharesFor: d.isShared && d.sharesFor ? parseInt(d.sharesFor) : undefined,
        })),
      })),
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push(`/restaurant/${restaurantId}`);
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

  return (
    <div className="min-h-screen px-4 py-8 max-w-3xl mx-auto">
      <Link
        href={`/restaurant/${restaurantId}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al panel
      </Link>

      <h1 className="text-2xl font-bold mb-6">Crear nuevo menú</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="menuName">Nombre del menú</Label>
              <Input
                id="menuName"
                placeholder='Ej: Menú Degustación 35€'
                value={menuName}
                onChange={(e) => setMenuName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="menuDesc">Descripción (opcional)</Label>
              <Textarea
                id="menuDesc"
                placeholder="Breve descripción del menú..."
                value={menuDescription}
                onChange={(e) => setMenuDescription(e.target.value)}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Courses */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Tiempos</h2>
            <Button type="button" variant="outline" size="sm" onClick={addCourse}>
              <Plus className="h-4 w-4 mr-1" />
              Añadir tiempo
            </Button>
          </div>

          {courses.map((course, courseIndex) => (
            <Card key={course.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                  <Input
                    value={course.name}
                    onChange={(e) =>
                      updateCourseName(course.id, e.target.value)
                    }
                    placeholder={`Tiempo ${courseIndex + 1}`}
                    className="font-semibold text-base border-0 px-0 focus-visible:ring-0 shadow-none"
                  />
                  {courses.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCourse(course.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {course.dishes.map((dish, dishIndex) => (
                  <div
                    key={dish.id}
                    className="border rounded-lg p-4 space-y-3 bg-muted/30"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Plato {dishIndex + 1}
                      </span>
                      {course.dishes.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDish(course.id, dish.id)}
                          className="text-destructive hover:text-destructive h-7 px-2"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <Input
                      placeholder="Nombre del plato"
                      value={dish.name}
                      onChange={(e) =>
                        updateDish(course.id, dish.id, "name", e.target.value)
                      }
                    />
                    <Input
                      placeholder="Descripción (opcional)"
                      value={dish.description}
                      onChange={(e) =>
                        updateDish(
                          course.id,
                          dish.id,
                          "description",
                          e.target.value
                        )
                      }
                    />
                    {/* Shared / Individual toggle */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground block">
                        Tipo de ración:
                      </Label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            updateDish(course.id, dish.id, "isShared", false);
                            updateDish(course.id, dish.id, "sharesFor", "");
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
                            !dish.isShared
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background border-border text-muted-foreground hover:border-primary/40"
                          }`}
                        >
                          <User className="h-3 w-3" />
                          Individual
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateDish(course.id, dish.id, "isShared", true)
                          }
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
                            dish.isShared
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background border-border text-muted-foreground hover:border-primary/40"
                          }`}
                        >
                          <Users className="h-3 w-3" />
                          Para compartir
                        </button>
                      </div>
                      {dish.isShared && (
                        <div className="flex items-center gap-2 mt-1">
                          <Label className="text-xs text-muted-foreground whitespace-nowrap">
                            Para cuántas personas:
                          </Label>
                          <Input
                            type="number"
                            min={2}
                            max={50}
                            placeholder="Ej: 4"
                            value={dish.sharesFor}
                            onChange={(e) =>
                              updateDish(
                                course.id,
                                dish.id,
                                "sharesFor",
                                e.target.value
                              )
                            }
                            className="h-8 w-24 text-sm"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">
                        Alérgenos que contiene este plato:
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {EU_ALLERGENS.map((allergen) => (
                          <label
                            key={allergen.id}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs cursor-pointer border transition-colors ${
                              dish.allergens.includes(allergen.id)
                                ? "bg-orange-100 border-orange-300 text-orange-800"
                                : "bg-background border-border text-muted-foreground hover:border-primary/30"
                            }`}
                          >
                            <Checkbox
                              checked={dish.allergens.includes(allergen.id)}
                              onCheckedChange={() =>
                                toggleAllergen(course.id, dish.id, allergen.id)
                              }
                              className="h-3 w-3"
                            />
                            <span>
                              {allergen.emoji} {allergen.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addDish(course.id)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Añadir plato
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {error && (
          <p className="text-sm text-destructive font-medium">{error}</p>
        )}

        <div className="flex gap-3">
          <Button type="submit" size="lg" className="flex-1" disabled={loading}>
            {loading ? "Guardando..." : "Guardar menú"}
          </Button>
          <Link href={`/restaurant/${restaurantId}`}>
            <Button type="button" variant="outline" size="lg">
              Cancelar
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
