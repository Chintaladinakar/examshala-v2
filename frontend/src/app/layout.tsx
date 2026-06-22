import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { UserProvider } from "@/context/UserContext";

export const metadata: Metadata = {
  // ── Core ──────────────────────────────────────────────────────────────────
  title: {
    default: "EDUsphere — Secure Online Examination Platform",
    template: "%s | EDUsphere",
  },
  description:
    "EDUsphere is a cloud-native virtual assessment platform for schools and institutions. Conduct proctored exams, manage assignments, and track student performance — all in one place.",

  // ── Discoverability ────────────────────────────────────────────────────────
  keywords: [
    "online examination",
    "virtual proctoring",
    "school assessment platform",
    "e-learning",
    "exam management",
    "student performance analytics",
    "LMS integration",
    "EDUsphere",
  ],
  authors: [{ name: "EDUsphere Team" }],
  creator: "EDUsphere",
  publisher: "EDUsphere",

  // ── Canonical & Robots ─────────────────────────────────────────────────────
  metadataBase: new URL("https://examshala.vercel.app"),
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },

  // ── OpenGraph (Facebook, LinkedIn, WhatsApp, Slack, etc.) ─────────────────
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://examshala.vercel.app",
    siteName: "EDUsphere",
    title: "EDUsphere — Secure Online Examination Platform",
    description:
      "Conduct proctored exams at scale. EDUsphere brings browser-lock technology, real-time webcam monitoring, and instant analytics to any institution.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "EDUsphere — Secure Online Examination Platform",
      },
    ],
  },

  // ── Twitter / X Card ──────────────────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    title: "EDUsphere — Secure Online Examination Platform",
    description:
      "Proctored exams, live monitoring, and student analytics — all free while credits last.",
    images: ["/og-image.png"],
    creator: "@EDUsphere",
  },

  // ── Icons ─────────────────────────────────────────────────────────────────
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <UserProvider>
          <ToastProvider>{children}</ToastProvider>
        </UserProvider>
      </body>
    </html>
  );
}
