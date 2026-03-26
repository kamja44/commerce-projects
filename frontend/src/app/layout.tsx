import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import Providers from './providers';

export const metadata: Metadata = {
  title: '통합 커머스 플랫폼',
  description: '중고거래, 구독 커머스, 소셜 커머스를 한 곳에서',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-gray-50">
        <Providers>
          <div className="min-h-screen">
            <header className="bg-white shadow-sm">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  <Link href="/" className="text-xl font-bold text-gray-900">
                    통합 커머스 플랫폼
                  </Link>

                  <nav className="flex gap-6">
                    <Link
                      href="/marketplace"
                      className="text-gray-700 hover:text-gray-900 font-medium"
                    >
                      중고거래
                    </Link>
                    <Link
                      href="/subscription"
                      className="text-gray-700 hover:text-gray-900 font-medium"
                    >
                      구독 커머스
                    </Link>
                    <Link
                      href="/social"
                      className="text-gray-700 hover:text-gray-900 font-medium"
                    >
                      소셜 커머스
                    </Link>
                  </nav>
                </div>
              </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
