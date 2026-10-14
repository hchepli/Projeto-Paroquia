import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css";
import HeaderComponent from "../components/layout/HeaderComponent";
import FooterCompoqnent from "../components/layout/FooterComponent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Paróquia Divino Espírito Santo - Joinville",
  description: "Site oficial da Paróquia Divino Espírito Santo - venha nos visitar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <HeaderComponent />
        <main className="min-h-full flex flex-col">
        {children}
        </main>
        <FooterCompoqnent />
        </body>
    </html>
  );
}
