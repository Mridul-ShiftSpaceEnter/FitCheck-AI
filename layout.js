// app/layout.js
import "./globals.css";

export const metadata = {
  title: "FitCheck AI — Honest Style Intelligence",
  description: "Get brutally honest AI feedback on your outfit. Powered by Google Gemini.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: "#0A0A0A" }}>
        {children}
      </body>
    </html>
  );
}
