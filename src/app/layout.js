import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Footer } from "./components/Footer";
import { createSupabaseServer } from "./lib/supabase/server";
import Header from "./components/Header";
import { getSiteUrl } from "./lib/site-url";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = getSiteUrl();

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "TrainerPT",
    template: "%s · TrainerPT",
  },
  description:
    "Gestiona clientes, rutinas y formularios desde una única aplicación web para entrenadores personales.",
  openGraph: {
    title: "TrainerPT",
    description:
      "Gestiona clientes, rutinas y formularios desde una única aplicación web para entrenadores personales.",
    locale: "es_ES",
    type: "website",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "TrainerPT",
    description:
      "Gestiona clientes, rutinas y formularios desde una única aplicación web para entrenadores personales.",
  },
};

export default async function RootLayout({ children }) {
  const supabase = await createSupabaseServer();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <html lang="es" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Header isLogged={!!session} />
        {children}
        <Footer />
      </body>
    </html>
  );
}
