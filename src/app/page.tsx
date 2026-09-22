"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ChefHat,
  Check,
  ClipboardCheck,
  Link2,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

const RESTAURANT_FORM = "https://forms.gle/wWPsb1U9R3MtrGeb7";
const USER_FORM = "https://forms.gle/d7dB8Hemoyy4pwYb8";

const steps = [
  {
    number: "01",
    title: "El restaurante prepara el menú",
    text: "Define los platos, las opciones y sus alérgenos una sola vez.",
  },
  {
    number: "02",
    title: "El organizador comparte",
    text: "Recibe un enlace y lo reenvía al grupo por el canal que ya utiliza.",
  },
  {
    number: "03",
    title: "Cada invitado elige",
    text: "Responde desde el móvil, sin registro, contraseñas ni descargas.",
  },
  {
    number: "04",
    title: "Cocina recibe el resumen",
    text: "Cantidades por plato, comensales y alérgenos quedan ordenados.",
  },
];

const restaurantBenefits = [
  "Conteo automático por plato y por tiempo",
  "Platos individuales o para compartir",
  "Alérgenos vinculados a cada elección",
  "Cierre de respuestas y resumen exportable",
];

export default function HomePage() {
  const router = useRouter();
  const [shareCode, setShareCode] = useState("");

  function handleCodeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = shareCode.trim().toLowerCase();
    if (code) router.push(`/event/${code}`);
  }

  return (
    <main className="overflow-hidden bg-[#fff8ee] text-[#28182c]">
      <section
        id="inicio"
        className="relative min-h-[760px] bg-[radial-gradient(circle_at_74%_44%,rgba(245,106,69,0.18),transparent_30%),linear-gradient(135deg,#211326_0%,#2e1d33_58%,#3a273d_100%)] text-white"
      >
        <header className="relative z-10 mx-auto grid h-[82px] w-[min(1180px,calc(100%_-_32px))] grid-cols-[1fr_auto] items-center border-b border-white/15 md:h-[88px] md:w-[min(1180px,calc(100%_-_48px))] md:grid-cols-[1fr_auto_1fr]">
          <a
            href="#inicio"
            aria-label="Gruppy, ir al inicio"
            className="flex w-max items-center gap-2.5 text-xl font-black tracking-[-0.04em]"
          >
            <Image src="/icon.svg" alt="" width={36} height={36} className="h-9 w-9 rounded-[10px]" priority />
            Gruppy
          </a>

          <nav className="hidden items-center gap-8 text-sm font-bold text-white/70 md:flex" aria-label="Navegación principal">
            <a className="transition-colors hover:text-white" href="#como-funciona">Cómo funciona</a>
            <a className="transition-colors hover:text-white" href="#restaurantes">Restaurantes</a>
            <a className="transition-colors hover:text-white" href="#codigo">Tengo un código</a>
          </nav>

          <a
            href={RESTAURANT_FORM}
            target="_blank"
            rel="noreferrer"
            className="justify-self-end rounded-full border border-white/30 px-4 py-2.5 text-xs font-black transition hover:-translate-y-0.5 hover:border-white/60 md:text-sm"
          >
            Solicitar información
          </a>
        </header>

        <div className="relative z-[2] mx-auto grid w-[min(1180px,calc(100%_-_40px))] grid-cols-1 items-center gap-12 py-16 md:w-[min(1180px,calc(100%_-_48px))] md:grid-cols-[1.02fr_.98fr] md:gap-14 md:py-20 lg:py-24">
          <div className="mx-auto max-w-[650px] text-center md:mx-0 md:text-left">
            <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#ff8664]">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Gestión de menús para grupos
            </div>

            <h1 className="mt-6 text-[clamp(3.6rem,7.4vw,6.7rem)] font-black leading-[0.89] tracking-[-0.07em]">
              Del WhatsApp al <span className="font-serif font-normal italic text-[#ff8664]">pase de cocina.</span>
            </h1>

            <p className="mx-auto mt-7 max-w-[610px] text-[1.03rem] leading-7 text-white/68 md:mx-0 md:text-lg">
              Gruppy reúne las elecciones y alérgenos de todo el grupo en un único resumen. El restaurante controla el menú, cada invitado responde desde su móvil y el organizador deja de perseguir a nadie.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row md:justify-start">
              <a
                href={RESTAURANT_FORM}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#f56a45] px-5 text-sm font-black shadow-[0_14px_32px_rgba(245,106,69,.2)] transition hover:-translate-y-0.5 hover:bg-[#ff7957]"
              >
                Quiero probarlo en mi restaurante <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href={USER_FORM}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/25 px-5 text-sm font-black transition hover:border-white/55"
              >
                Soy organizador o comensal
              </a>
            </div>

            <div className="mt-6 flex flex-col items-center justify-center gap-2 text-xs text-white/50 sm:flex-row sm:gap-5 md:justify-start">
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#ff8664]" /> Sin app para invitados</span>
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#ff8664]" /> Sin cuentas para el grupo</span>
            </div>
          </div>

          <div className="relative mx-auto min-h-[440px] w-full max-w-[570px] md:min-h-[500px]">
            <div className="absolute inset-[8%_0_0_5%] rounded-full bg-[#f56a45]/20 blur-[70px]" />

            <div className="absolute inset-x-0 top-10 z-[2] rounded-[24px] border border-white/15 bg-[#fffdf8]/[.98] p-5 text-[#28182c] shadow-[0_34px_80px_rgba(0,0,0,.28)] md:left-4 md:right-1 md:top-14 md:rotate-[1.3deg] md:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="block text-[10px] font-black uppercase tracking-[0.12em] text-[#8f818e]">Ejemplo de evento</span>
                  <strong className="mt-1 block text-lg tracking-[-0.03em]">Resumen de producción</strong>
                </div>
                <span className="rounded-full bg-[#fff1bb] px-3 py-2 text-[11px] font-black text-[#80640a]">18 de 22</span>
              </div>

              <div className="my-5 h-2 overflow-hidden rounded-full bg-[#ece5e6]">
                <span className="block h-full w-[82%] rounded-full bg-[#f56a45]" />
              </div>

              <div>
                {[
                  ["Solomillo a la brasa", "8"],
                  ["Lubina con verduras", "6"],
                  ["Risotto de temporada", "4"],
                ].map(([dish, count]) => (
                  <div key={dish} className="flex items-center justify-between border-b border-[#eee7e6] py-3.5 text-sm">
                    <span>{dish}</span>
                    <strong className="grid h-8 w-8 place-items-center rounded-lg bg-[#28182c] text-white">{count}</strong>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid grid-cols-[34px_1fr_18px] items-center gap-3 rounded-[14px] bg-[#fff2cf] p-4 text-[#764c08]">
                <ShieldCheck className="h-7 w-7" aria-hidden="true" />
                <div>
                  <strong className="block text-xs">Necesidades especiales</strong>
                  <span className="mt-0.5 block text-[11px] opacity-70">3 respuestas requieren revisión</span>
                </div>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>

            <div className="absolute bottom-4 left-[-8px] z-[4] flex items-center gap-3 rounded-2xl border border-white/25 bg-[#28182c]/95 p-3 shadow-2xl md:bottom-12 md:left-[-20px]">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#b9d9cf] text-xs font-black text-[#28182c]">LM</span>
              <div><strong className="block text-xs">Lucía ha respondido</strong><small className="text-[10px] text-white/50">Entrante · Principal · Postre</small></div>
              <Check className="h-4 w-4 text-[#ff8664]" aria-hidden="true" />
            </div>

            <div className="absolute right-[-8px] top-2 z-[4] flex items-center gap-3 rounded-2xl border border-white/25 bg-[#28182c]/95 p-3 shadow-2xl md:right-[-20px] md:top-6">
              <ClipboardCheck className="h-6 w-6 text-[#ff8664]" aria-hidden="true" />
              <div><strong className="block text-xs">Listo para cocina</strong><small className="text-[10px] text-white/50">Resumen actualizado</small></div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-[5] mx-auto -mt-7 grid w-[min(1080px,calc(100%_-_28px))] grid-cols-1 items-center gap-4 rounded-[20px] border border-[#28182c]/10 bg-[#fffdf8] px-6 py-6 shadow-[0_18px_50px_rgba(40,24,44,.09)] md:w-[min(1080px,calc(100%_-_48px))] md:grid-cols-[1fr_auto_1fr] md:gap-7 md:px-8">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#f56a45]">Antes</span>
          <strong className="mt-1 block text-sm leading-6">Mensajes, hojas de cálculo y cambios de última hora.</strong>
        </div>
        <ArrowRight className="h-5 w-5 rotate-90 text-[#f56a45] md:rotate-0" aria-hidden="true" />
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#f56a45]">Con Gruppy</span>
          <strong className="mt-1 block text-sm leading-6">Un enlace para el grupo. Un resumen para cocina.</strong>
        </div>
      </section>

      <section id="como-funciona" className="mx-auto w-[min(1180px,calc(100%_-_40px))] py-24 md:w-[min(1180px,calc(100%_-_48px))] md:py-32">
        <div className="max-w-[760px]">
          <span className="text-[11px] font-black uppercase tracking-[0.16em] text-[#ed5937]">Un flujo para todos</span>
          <h2 className="mt-4 text-[clamp(3rem,6vw,5.4rem)] font-black leading-[0.93] tracking-[-0.065em]">El grupo elige.<br />Gruppy lo ordena.</h2>
          <p className="mt-6 max-w-[650px] text-base leading-7 text-[#756a74] md:text-lg">
            Gruppy no sustituye la reserva. Entra justo después, cuando hay que convertir un menú de grupo en información útil para sala y cocina.
          </p>
        </div>

        <ol className="mt-12 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <li key={step.number} className="rounded-[20px] border border-[#28182c]/10 bg-white/55 p-7 lg:min-h-[250px]">
              <span className="text-[11px] font-black tracking-[0.14em] text-[#ed5937]">{step.number}</span>
              <h3 className="mt-8 text-lg font-black leading-snug tracking-[-0.03em] lg:mt-14">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#80747d]">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="restaurantes" className="mx-auto grid w-[min(1180px,calc(100%_-_40px))] grid-cols-1 items-center gap-14 pb-24 md:w-[min(1180px,calc(100%_-_48px))] md:grid-cols-[.95fr_1.05fr] md:gap-20 md:pb-32">
        <div>
          <span className="text-[11px] font-black uppercase tracking-[0.16em] text-[#ed5937]">Para quien gestiona el evento</span>
          <h2 className="mt-4 text-[clamp(3rem,5.5vw,5.1rem)] font-black leading-[0.94] tracking-[-0.065em]">Menos copiar y contar.<br />Más control.</h2>
          <p className="mt-6 max-w-[620px] text-base leading-7 text-[#756a74] md:text-lg">
            Gruppy es una herramienta operativa para restaurantes que trabajan con comidas de empresa, celebraciones y otros grupos con menú cerrado.
          </p>
          <ul className="my-7 grid list-none gap-3 p-0">
            {restaurantBenefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-2.5 text-sm font-bold text-[#514650]">
                <Check className="h-[18px] w-[18px] rounded-full bg-[#f56a45] p-[3px] text-white" aria-hidden="true" />
                {benefit}
              </li>
            ))}
          </ul>
          <a
            href={RESTAURANT_FORM}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#f56a45] px-5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#ff7957]"
          >
            Solicitar información <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>

        <div className="grid gap-3 rounded-[28px] bg-[#28182c] p-[18px] text-white shadow-[0_30px_70px_rgba(40,24,44,.16)]">
          {[
            { icon: ChefHat, label: "Quien contrata", title: "Restaurante", text: "Configura menús y eventos. Recibe la información lista para trabajar.", color: "bg-[#f56a45] text-white" },
            { icon: Link2, label: "Quien distribuye", title: "Organizador", text: "Comparte el enlace y comprueba quién ha respondido sin rehacer listas.", color: "bg-[#e7c86b] text-[#28182c]" },
            { icon: Users, label: "Quien responde", title: "Invitado", text: "Elige sus platos y declara alérgenos en una experiencia rápida y privada.", color: "bg-[#b9d9cf] text-[#28182c]" },
          ].map(({ icon: Icon, label, title, text, color }) => (
            <article key={title} className="grid grid-cols-[50px_1fr] gap-x-4 rounded-[18px] border border-white/10 bg-white/[.04] p-5 md:p-6">
              <span className={`row-span-2 grid h-12 w-12 place-items-center rounded-[14px] ${color}`}><Icon className="h-5 w-5" aria-hidden="true" /></span>
              <div className="self-center"><small className="text-[10px] font-black uppercase tracking-[0.11em] text-white/50">{label}</small><h3 className="mt-0.5 text-lg font-black">{title}</h3></div>
              <p className="col-start-2 mt-2 text-sm leading-6 text-white/60">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto mb-24 grid w-[min(1100px,calc(100%_-_32px))] grid-cols-1 items-center gap-8 rounded-[28px] bg-[#ffe7da] px-6 py-10 md:mb-32 md:grid-cols-[1fr_.85fr] md:gap-16 md:px-14 md:py-14">
        <div>
          <span className="text-[11px] font-black uppercase tracking-[0.16em] text-[#ed5937]">Organizadores y comensales</span>
          <h2 className="mt-4 text-[clamp(2.8rem,5vw,4.8rem)] font-black leading-[.95] tracking-[-0.06em]">También queremos escucharte.</h2>
          <p className="mt-5 max-w-[550px] leading-7 text-[#74636c]">Apúntate para conocer cuándo podrás utilizar Gruppy en tu próxima comida o cena de grupo.</p>
        </div>
        <div className="rounded-[20px] bg-[#fffdf8] p-6 shadow-[0_14px_34px_rgba(92,52,48,.08)]">
          <span className="grid h-11 w-11 place-items-center rounded-[13px] bg-[#b9d9cf] text-[#28182c]"><Users className="h-5 w-5" aria-hidden="true" /></span>
          <strong className="mt-5 block text-lg">¿Organizas o participas en grupos?</strong>
          <p className="mt-2 text-sm leading-6 text-[#756a74]">Cuéntanos cómo usarías Gruppy y te avisaremos cuando esté disponible.</p>
          <a
            href={USER_FORM}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex min-h-12 w-full items-center justify-between rounded-xl bg-[#28182c] px-5 text-sm font-black text-white transition hover:bg-[#3a2740]"
          >
            Quiero que me aviséis <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </section>

      <section id="codigo" className="bg-[#fffdf8] px-5 py-24 md:py-28">
        <div className="mx-auto grid max-w-[1000px] grid-cols-1 items-center gap-10 md:grid-cols-[1fr_.82fr] md:gap-16">
          <div>
            <span className="text-[11px] font-black uppercase tracking-[0.16em] text-[#ed5937]">¿Ya te han invitado?</span>
            <h2 className="mt-4 text-[clamp(3rem,5vw,4.7rem)] font-black leading-[.94] tracking-[-0.06em]">Entra con tu código.</h2>
            <p className="mt-5 max-w-[520px] leading-7 text-[#756a74]">No necesitas registrarte. Introduce los seis caracteres que te ha enviado el organizador.</p>
          </div>

          <form onSubmit={handleCodeSubmit} className="rounded-[20px] border border-[#28182c]/10 bg-white p-6 shadow-[0_18px_45px_rgba(40,24,44,.07)]">
            <label htmlFor="share-code" className="mb-2 block text-[11px] font-black uppercase tracking-[0.1em] text-[#756a74]">Código de invitación</label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
              <input
                id="share-code"
                value={shareCode}
                onChange={(event) => setShareCode(event.target.value.replace(/[^a-z0-9]/gi, "").slice(0, 6))}
                placeholder="ABC123"
                maxLength={6}
                autoComplete="off"
                required
                className="h-12 min-w-0 rounded-xl border border-[#ded4d2] bg-white px-4 text-lg font-black uppercase tracking-[0.16em] outline-none transition focus:border-[#f56a45] focus:ring-4 focus:ring-[#f56a45]/10"
              />
              <button type="submit" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#28182c] px-5 text-sm font-black text-white transition hover:bg-[#3a2740]">
                Entrar <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="bg-[#28182c] px-5 py-24 text-center text-white md:py-28">
        <span className="text-[11px] font-black uppercase tracking-[0.16em] text-[#ff8664]">Tu próximo grupo</span>
        <h2 className="mx-auto mt-4 max-w-[900px] text-[clamp(3rem,5.5vw,5.3rem)] font-black leading-[.93] tracking-[-0.06em]">Del menú al resumen,<br />sin pasos de más.</h2>
        <p className="mx-auto mt-6 max-w-[610px] leading-7 text-white/60">Estamos hablando con los primeros restaurantes para validar Gruppy en situaciones reales.</p>
        <a
          href={RESTAURANT_FORM}
          target="_blank"
          rel="noreferrer"
          className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-[#28182c] transition hover:-translate-y-0.5 hover:bg-[#f56a45] hover:text-white"
        >
          Quiero probar Gruppy <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </a>
      </section>
    </main>
  );
}
