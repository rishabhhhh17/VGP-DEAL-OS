import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { ToastProvider } from "@/components/Toast";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "VGP OS",
  description: "Deal & Interaction Operating System",
};

// Runs synchronously before paint — prevents theme flash
const themeScript = `(function(){try{var t=localStorage.getItem('vgp-theme')||'dark';document.documentElement.setAttribute('data-theme',t)}catch(e){}})()`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full" data-theme="dark">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex h-full overflow-hidden" style={{ background: "var(--s-bg)" }}>
        <ThemeProvider>
          <Sidebar />
          <main className="flex-1 overflow-auto" style={{ background: "var(--s-bg)" }}>
            <ToastProvider>
              {children}
            </ToastProvider>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
