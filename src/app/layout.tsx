import type { Metadata, Viewport } from 'next';
import { Inter, Roboto_Mono } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import './globals.css';
import { JournalProvider } from '@/contexts/JournalContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { PlaybookProvider } from '@/contexts/PlaybookContext';
import { TradeProvider } from '@/contexts/TradeContext';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Header } from '@/components/layout/Header';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import AuthMiddleware from '@/components/auth/AuthMiddleware';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const robotoMono = Roboto_Mono({
  variable: '--font-roboto-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Trade Insights',
  description: 'Track your trading history and analyze performance.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="overflow-x-hidden">
      <body className={cn(inter.variable, robotoMono.variable, 'antialiased font-sans overflow-x-hidden')}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <LanguageProvider>
            <AuthProvider>
              <AuthMiddleware>
                <JournalProvider>
                  <TradeProvider>
                    <PlaybookProvider>
                      <SidebarProvider>
                        <div className="flex min-h-screen w-full">
                          <AppSidebar />
                          <div className="flex flex-1 flex-col w-full max-w-full">
                            <Header />
                            <main className="flex-1 p-2 sm:p-4 md:p-6 lg:p-8 bg-secondary/50 w-full overflow-x-hidden">
                              <div className="max-w-full">
                                {children}
                              </div>
                            </main>
                          </div>
                        </div>
                      </SidebarProvider>
                    </PlaybookProvider>
                  </TradeProvider>
                </JournalProvider>
              </AuthMiddleware>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
