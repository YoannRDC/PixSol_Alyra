import { ReactNode } from 'react';
import { AppProvider } from './contexts/AppProvider';
import dynamic from 'next/dynamic';
import Header from './components/Header';
import './globals.css';

const ClientWalletProviderComponent = dynamic(
  () => import('./components/ClientWalletProvider').then(mod => mod.ClientWalletProvider),
  { ssr: false }
);

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClientWalletProviderComponent>
          <AppProvider>
            <Header />
            <main className="container mx-auto px-4 py-8">
              {children}
            </main>
          </AppProvider>
        </ClientWalletProviderComponent>
      </body>
    </html>
  );
}