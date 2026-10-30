import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import { InlineScript } from "@/components/InlineScript";
import "./globals.css";

// The host app's typeface is proprietary; Figtree is the closest free match
// with tabular figures, so animated numbers don't jitter.
const figtree = Figtree({
  variable: "--font-figtree",
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
  themeColor: "#131416",
  // Lets the app draw under the notch and home indicator; safe-area insets pad it back.
  viewportFit: "cover",
};

// Dark is the default. Applies a saved light choice before first paint (no flash).
const themeScript = `(function(){try{if(localStorage.getItem("theme")==="light")document.documentElement.setAttribute("data-theme","light")}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={figtree.variable} suppressHydrationWarning>
      <head>
        <InlineScript html={themeScript} />
      </head>
      <body>{children}</body>
    </html>
  );
}
