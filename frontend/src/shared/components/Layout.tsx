import { Link } from 'react-router-dom';

/**
 * Layout 컴포넌트
 * - 역할: 전체 페이지 레이아웃 (헤더 + 메인 콘텐츠)
 * - 기능: 네비게이션 바 제공
 */
interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-xl font-bold text-gray-900">
              통합 커머스 플랫폼
            </Link>

            <nav className="flex gap-6">
              <Link
                to="/marketplace"
                className="text-gray-700 hover:text-gray-900 font-medium"
              >
                중고거래
              </Link>
              <Link
                to="/subscription"
                className="text-gray-700 hover:text-gray-900 font-medium"
              >
                구독 커머스
              </Link>
              <Link to="/social" className="text-gray-700 hover:text-gray-900 font-medium">
                소셜 커머스
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}
