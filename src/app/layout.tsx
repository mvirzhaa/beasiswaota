import type { Metadata } from "next";
import { Roboto, Yantramanav } from "next/font/google";
import "./globals.css";

// Roboto + Yantramanav: font family yang sama persis dengan uika-bogor.ac.id
// (--body-font / --heading-font di style.css mereka).
const fontBody = Roboto({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const fontHeading = Yantramanav({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: {
    default: "Beasiswa Orang Tua Asuh — Universitas Ibn Khaldun Bogor",
    template: "%s | Beasiswa Orang Tua Asuh UIKA Bogor",
  },
  description:
    "Portal Resmi Program Beasiswa Orang Tua Asuh Universitas Ibn Khaldun (UIKA) Bogor. Membantu biaya pendidikan mahasiswa berprestasi dan membutuhkan secara transparan dan akuntabel.",
  icons: {
    icon: [
      { url: "/images/logo-uika.png", sizes: "any" },
      { url: "/images/logo-uika.png", type: "image/png" },
    ],
    shortcut: "/images/logo-uika.png",
    apple: "/images/logo-uika.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${fontBody.variable} ${fontHeading.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
