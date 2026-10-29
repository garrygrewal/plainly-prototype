import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const description =
  "A concept for prediction markets that explain themselves: one live hockey game, from discovery to cash-out, with every probability in plain words.";

// Absolute URLs for the Open Graph image. Vercel sets the production domain.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Plainly: prediction markets in plain words",
    template: "%s · Plainly",
  },
  description,
  openGraph: {
    title: "Plainly: prediction markets in plain words",
    description,
    type: "website",
    siteName: "Plainly",
  },
  twitter: {
    card: "summary_large_image",
    title: "Plainly: prediction markets in plain words",
    description,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f4ef" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1012" },
  ],
};

// Applies a saved light/dark choice before first paint (no flash).
const themeScript = `(function(){try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={geist.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
