import type { AppProps } from "next/app";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import "@/styles/globals.css";

const archivo = Archivo({ subsets: ["latin"], display: "swap" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], display: "swap" });

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <style jsx global>{`
        :root {
          --font-text: ${archivo.style.fontFamily};
          --font-mono: ${plexMono.style.fontFamily};
        }
      `}</style>
      <Component {...pageProps} />
    </>
  );
}
