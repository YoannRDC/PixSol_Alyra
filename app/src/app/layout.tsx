import { ReactNode } from 'react';
import { AppProvider } from './contexts/AppProvider';
import { ChakraProvider } from '@chakra-ui/react';
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
        <ChakraProvider>
          <ClientWalletProviderComponent>
            <AppProvider>
              <Header />
              <main className="container mx-auto px-4 py-8">
                {children}
              </main>
            </AppProvider>
          </ClientWalletProviderComponent>
        </ChakraProvider>
      </body>
    </html>
  );
}