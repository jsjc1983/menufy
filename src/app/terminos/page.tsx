import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-12 prose prose-slate">
      <h1>Condiciones de la demostración</h1>
      <p>Gruppy se encuentra en fase de demostración. No debe usarse para emergencias ni como única fuente de información sobre seguridad alimentaria.</p>
      <h2>Responsabilidad del restaurante</h2>
      <p>El restaurante debe verificar ingredientes, alérgenos, trazas, cambios de receta y contaminación cruzada. Una coincidencia o ausencia de aviso en Gruppy no sustituye esa comprobación profesional.</p>
      <h2>Uso permitido</h2>
      <p>No introduzcas datos falsos, accedas a eventos ajenos ni compartas enlaces privados de seguimiento. Durante la fase comercial deben utilizarse datos ficticios salvo acuerdo de piloto y documentación legal específica.</p>
      <p><Link href="/">Volver al inicio</Link></p>
    </main>
  );
}
