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
  title: "Beasiswa Orangtua Asuh — UIKA",
  description: "Sistem Beasiswa Orangtua Asuh Universitas Ibn Khaldun Bogor",
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
