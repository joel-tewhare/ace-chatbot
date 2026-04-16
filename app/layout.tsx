import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ACE Chatbot",
  description: "Agentic Coding Essentials - Multi-provider chatbot",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" style={{ colorScheme: "light" }}>
      <body className="min-h-screen antialiased bg-white text-black">{children}</body>
    </html>
  );
}
