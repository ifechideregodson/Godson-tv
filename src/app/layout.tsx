import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Godsotv — Your world, on screen", description: "Watch Godsotv live broadcasts and on-demand programs." };
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}
