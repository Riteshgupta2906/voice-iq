import "./globals.css";
import { AppDataProvider } from "@/components/providers/app-data-provider";
import { ProgressProvider } from "@/components/providers/progress-provider";

export const metadata = {
  title: "Voice IQ",
  description:
    "A voice-verified LMS POC where lecture completion triggers an AI calling workflow."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div
            className="absolute left-0 top-0 h-[40rem] w-[40rem] rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(232,76,43,0.12) 0%, transparent 70%)" }}
          />
          <div
            className="absolute bottom-0 right-0 h-[36rem] w-[36rem] rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(201,168,76,0.09) 0%, transparent 70%)" }}
          />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
              backgroundSize: "72px 72px"
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(10,10,15,0.2),rgba(10,10,15,0.95)_60%)]" />
        </div>
        <AppDataProvider>
          <ProgressProvider>{children}</ProgressProvider>
        </AppDataProvider>
      </body>
    </html>
  );
}
