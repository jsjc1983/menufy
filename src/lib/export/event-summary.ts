import type { getEventById } from "@/lib/actions/event";
import { getAllergenById, parseAllergenIds } from "@/lib/allergens";

type EventData = NonNullable<Awaited<ReturnType<typeof getEventById>>>;

const SEP = "=".repeat(60);
const SUB = "-".repeat(40);

function pad(label: string, value: string, width = 52): string {
  const dots = Math.max(3, width - label.length - value.length);
  return `  ${label} ${".".repeat(dots)} ${value}`;
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function generateEventSummary(event: EventData): string {
  const lines: string[] = [];
  const now = new Date().toLocaleString("es-ES");
  const pending = event.guestCount - event.guests.length;

  // ── Cabecera ──────────────────────────────────────────────
  lines.push(SEP);
  lines.push("GRUPPY — PARTE DE COCINA");
  lines.push(SEP);
  lines.push("");
  lines.push(`EVENTO:       ${event.name}`);
  lines.push(`FECHA:        ${formatDate(event.date)}`);
  lines.push(`RESTAURANTE:  ${event.restaurant.name}`);
  lines.push(`MENÚ:         ${event.menu.name}`);
  lines.push(`ORGANIZADOR:  ${event.organizerName}`);
  lines.push(`GENERADO:     ${now}`);
  lines.push("");
  const statusLine =
    pending > 0
      ? `${event.guests.length} de ${event.guestCount} respuestas — ${pending} pendientes`
      : `${event.guests.length} de ${event.guestCount} respuestas — COMPLETO`;
  lines.push(`RESPUESTAS:   ${statusLine}`);
  lines.push("");

  // ── Producción ────────────────────────────────────────────
  lines.push(SEP);
  lines.push("PRODUCCIÓN POR TIEMPOS");
  lines.push(SEP);

  for (const course of event.menu.courses) {
    lines.push("");
    lines.push(course.name.toUpperCase());

    const dishStats: Record<string, { count: number; dish: (typeof course.dishes)[0] }> = {};
    for (const dish of course.dishes) {
      dishStats[dish.name] = { count: 0, dish };
    }
    for (const guest of event.guests) {
      for (const sel of guest.selections) {
        if (sel.dish.course?.id === course.id && dishStats[sel.dish.name]) {
          dishStats[sel.dish.name].count += 1;
        }
      }
    }

    const sorted = Object.entries(dishStats).sort((a, b) => b[1].count - a[1].count);
    for (const [dishName, { count, dish }] of sorted) {
      if (dish.isShared && dish.sharesFor) {
        const portions = Math.ceil(count / dish.sharesFor);
        lines.push(
          pad(dishName, `${count} sel. → ${portions} rac. (×${dish.sharesFor}p)`)
        );
      } else {
        lines.push(pad(dishName, String(count)));
      }
    }
  }

  // ── Alérgenos ─────────────────────────────────────────────
  lines.push("");
  lines.push(SEP);
  lines.push("ALÉRGENOS E INTOLERANCIAS");
  lines.push(SEP);

  // Alertas de conflicto
  const alerts: { guestName: string; dishName: string; conflicts: string[] }[] = [];
  for (const guest of event.guests) {
    const guestAllergens = parseAllergenIds(guest.allergens);
    if (guestAllergens.length === 0) continue;
    for (const sel of guest.selections) {
      const dishAllergens = parseAllergenIds(sel.dish.allergens);
      const conflicts = guestAllergens.filter((a) => dishAllergens.includes(a));
      if (conflicts.length > 0) {
        alerts.push({
          guestName: guest.name,
          dishName: sel.dish.name,
          conflicts: conflicts.map((a) => getAllergenById(a)?.name?.toUpperCase() || a),
        });
      }
    }
  }

  if (alerts.length > 0) {
    lines.push("");
    lines.push(`  ⚠  ALERTAS DE RIESGO (${alerts.length} conflicto${alerts.length !== 1 ? "s" : ""})`);
    lines.push(`  ${SUB}`);
    for (const alert of alerts) {
      lines.push(
        `  ${alert.guestName} — eligió "${alert.dishName}" que contiene: ${alert.conflicts.join(", ")}`
      );
    }
  }

  // Comensales con restricciones
  const guestsWithRestrictions = event.guests.filter((g) => {
    const allergens = parseAllergenIds(g.allergens);
    return allergens.length > 0 || g.allergyNotes;
  });

  if (guestsWithRestrictions.length > 0) {
    lines.push("");
    lines.push("  COMENSALES CON RESTRICCIONES");
    lines.push(`  ${SUB}`);
    for (const guest of guestsWithRestrictions) {
      const allergens = parseAllergenIds(guest.allergens);
      const allergenNames = allergens
        .map((a) => getAllergenById(a)?.name || a)
        .join(", ");
      const dishNames = event.menu.courses
        .map((course) => {
          const sel = guest.selections.find((s) => s.dish.course?.id === course.id);
          return sel ? sel.dish.name : null;
        })
        .filter(Boolean)
        .join(" / ");
      let line = `  ${guest.name}`;
      if (allergenNames) line += ` — ${allergenNames}`;
      if (dishNames) line += ` — eligió: ${dishNames}`;
      if (guest.allergyNotes) line += ` — observación: ${guest.allergyNotes}`;
      lines.push(line);
    }
  }

  if (alerts.length === 0 && guestsWithRestrictions.length === 0) {
    lines.push("");
    lines.push("  Sin restricciones declaradas.");
  }

  // ── Pendientes ────────────────────────────────────────────
  lines.push("");
  lines.push(SEP);
  lines.push("PENDIENTES DE RESPONDER");
  lines.push(SEP);
  lines.push("");
  if (pending <= 0) {
    lines.push("  Todos los comensales han respondido.");
  } else {
    lines.push(
      `  ${pending} comensal${pending !== 1 ? "es" : ""} sin responder de ${event.guestCount} esperados.`
    );
  }

  // ── Listado por comensal ──────────────────────────────────
  lines.push("");
  lines.push(SEP);
  lines.push("LISTADO COMPLETO POR COMENSAL");
  lines.push(SEP);

  if (event.guests.length === 0) {
    lines.push("");
    lines.push("  Sin respuestas registradas.");
  } else {
    event.guests.forEach((guest, index) => {
      const allergens = parseAllergenIds(guest.allergens);
      lines.push("");
      lines.push(`  ${index + 1}. ${guest.name}`);
      for (const course of event.menu.courses) {
        const sel = guest.selections.find((s) => s.dish.course?.id === course.id);
        lines.push(`     ${course.name}: ${sel?.dish.name ?? "—"}`);
      }
      if (allergens.length > 0) {
        const allergenNames = allergens
          .map((a) => getAllergenById(a)?.name || a)
          .join(", ");
        lines.push(`     Alérgenos: ${allergenNames}`);
      }
      if (guest.allergyNotes) {
        lines.push(`     Notas: ${guest.allergyNotes}`);
      }
    });
  }

  lines.push("");
  lines.push(SEP);
  lines.push(`Generado por Gruppy — ${now}`);
  lines.push(SEP);

  return lines.join("\n");
}

export function eventSummaryFilename(event: { name: string; date: Date | string }): string {
  const dateStr = new Date(event.date)
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");
  const slug = event.name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  return `gruppy-${slug}-${dateStr}.txt`;
}
