import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Examshala - Smart Online Examination Platform',
  description: 'Create, manage, and conduct online exams with ease',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
