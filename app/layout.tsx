import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agent RTC",
  description: "Real-time communication broker for inter-agent messaging",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-parchment text-near-black min-h-screen">
        {children}
      </body>
    </html>
  );
}
