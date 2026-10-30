import { Bricolage_Grotesque, Source_Sans_3 } from "next/font/google";

// Self-hosted by next/font (docs/design-plan.md §3.1). app/theme.css reads
// these variables into --ply-font-heading and --ply-font-body.

export const headingFont = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: "variable",
  variable: "--font-heading",
  display: "swap",
});

export const bodyFont = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-body",
  display: "swap",
});
