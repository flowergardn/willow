import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { cn } from "~/lib/utils";
import { Toaster } from "~/components/ui/sonner";
import { TooltipProvider } from "~/components/ui/tooltip";

export const metadata: Metadata = {
  title: "willow",
  description: "minimalist time tracking",
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn("dark", geist.variable)}>
      <body>
        <Toaster richColors position="top-center" />
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
