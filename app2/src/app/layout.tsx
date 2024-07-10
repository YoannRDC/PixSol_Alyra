import { ReactNode } from 'react';
import { AppProvider } from './contexts/AppProvider';
import dynamic from 'next/dynamic';
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
            {children}
          </AppProvider>
        </ClientWalletProviderComponent>
      </body>
    </html>
  );
}