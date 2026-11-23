/** Three families: Archivo (wide for page titles, narrow for figures), Instrument Serif italic, Inter for text. */
export const fonts = {
  body: { value: "var(--font-sans)" },
  display: { value: "var(--font-sans)" },
  serif: { value: "var(--font-display)" },
};

/** Barlow (every text) and Cormorant Garamond (Marbre headings), from the design system. */
export const fontsHref =
  "https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Cormorant+Garamond:wght@600;700&display=swap";

const wide = { fontFamily: "display", fontStretch: "125%", fontWeight: "800" };
const narrow = { fontFamily: "display", fontStretch: "62%", fontWeight: "800" };

export const textStyles = {
  logo: { value: { ...wide, fontSize: "16px" } },
  pageTitle: { value: { ...wide, fontSize: "32px", letterSpacing: "-0.01em" } },
  wide: { value: wide },
  narrow: { value: narrow },
  serif: { value: { fontFamily: "serif", fontStyle: "italic", fontWeight: "400" } },
  name: { value: { fontSize: "28px", fontWeight: "500", letterSpacing: "-0.01em" } },
  block: { value: { fontSize: "15px", fontWeight: "600" } },
  label: { value: { fontSize: "10px", fontWeight: "600", letterSpacing: "0.06em" } },
};
