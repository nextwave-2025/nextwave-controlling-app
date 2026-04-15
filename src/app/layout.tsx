import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NEXTWAVE Controlling App",
  description: "Controlling Dashboard für NEXTWAVE",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}