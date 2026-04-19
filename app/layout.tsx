import type { Metadata } from "next";

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
      <body>{children}</body>
    </html>
  );
}
