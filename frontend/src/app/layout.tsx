import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Examshala - Virtual Assessment Platform",
  description: "Secure, reliable, and scalable online examination system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
