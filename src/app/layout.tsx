import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spending Visualizer",
  description: "Visualize your Apple Pay spending",
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
