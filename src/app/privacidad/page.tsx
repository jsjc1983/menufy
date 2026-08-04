import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-12 prose prose-slate">
      <h1>Privacidad</h1>
      <p><strong>Versión de demostración — 4 de agosto de 2026.</strong></p>
      <p>Gruppy trata los datos necesarios para gestionar elecciones de menú de grupo: nombre del invitado, platos elegidos y, cuando la persona decide aportarlos, alergias, intolerancias y notas relacionadas.</p>
      <h2>Finalidad y acceso</h2>
      <p>Los datos se usan exclusivamente para organizar el evento y preparar el servicio. El restaurante responsable del evento puede acceder a las respuestas. El enlace público de votación no muestra respuestas de otras personas.</p>
      <h2>Datos sensibles</h2>
      <p>La información sobre alergias puede considerarse un dato de salud. Solo debe facilitarse cuando sea necesario. Gruppy ofrece avisos operativos, pero el restaurante debe confirmar ingredientes, trazas y contaminación cruzada.</p>
      <h2>Conservación y derechos</h2>
      <p>Para solicitar acceso, corrección o eliminación, contacta con el restaurante responsable del evento o con <a href="mailto:privacidad@gruppy.app">privacidad@gruppy.app</a>. Antes de un piloto real deberán concretarse el responsable legal, encargado de tratamiento, ubicación, plazos de conservación y proveedores.</p>
      <p><Link href="/">Volver al inicio</Link></p>
    </main>
  );
}
