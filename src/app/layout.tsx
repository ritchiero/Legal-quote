import type { Metadata } from 'next';
import './globals.css';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import { AuthProvider } from '@/lib/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import AuthenticatedLayout from './components/AuthenticatedLayout';

const inter = Inter({ subsets: ['latin'] })

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jakarta',
});

export const metadata: Metadata = {
  title: 'LegalAIQuote',
  description: 'Tu asistente legal inteligente',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={jakarta.variable}>
      <body className="font-jakarta bg-background text-text-main">
        <AuthProvider>
          <AuthenticatedLayout>
            {children}
          </AuthenticatedLayout>
        </AuthProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
