import type { Metadata } from 'next';
import { Inter, Roboto_Mono } from 'next/font/google';
import './globals.css';
import { TradeProvider } from '@/contexts/TradeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Header } from '@/components/layout/Header';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.variable, robotoMono.variable, 'antialiased font-sans')}>
        <LanguageProvider>
          <TradeProvider>
            <SidebarProvider>
              <div className="flex min-h-screen w-full">
                <AppSidebar />
                <div className="flex flex-1 flex-col">
                  <Header />
                  <main className="flex-1 p-4 md:p-6 lg:p-8 bg-secondary/50">
                    {children}
                  </main>
                </div>
              </div>
            </SidebarProvider>
          </TradeProvider>
        </LanguageProvider>
        <Toaster />
      </body>
    </html>
  );
}
