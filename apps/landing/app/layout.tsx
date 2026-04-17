import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SecureVault - Your Password Manager",
  description: "A beautiful, secure, and easy-to-use password manager for all your devices. Keep your passwords safe with military-grade encryption.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${nunito.variable} font-sans antialiased min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
