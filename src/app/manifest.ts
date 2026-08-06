import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gruppy — Menús de grupo",
    short_name: "Gruppy",
    description: "Gestión de menús y elecciones para eventos de grupo.",
    start_url: "/",
    display: "standalone",
    background_color: "#fffaf2",
    theme_color: "#d97706",
    lang: "es",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
