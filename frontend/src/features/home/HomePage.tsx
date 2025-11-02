import { Link } from 'react-router-dom';
import Card from '../../shared/components/Card';
import Button from '../../shared/components/Button';

/**
 * HomePage 컴포넌트
 * - 역할: 메인 홈 페이지
 * - 기능: 3가지 커머스 옵션 소개
 */
export default function HomePage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">통합 커머스 플랫폼</h1>
        <p className="text-xl text-gray-600">
          중고거래, 구독 커머스, 소셜 커머스를 한 곳에서
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        {/* 중고거래 카드 */}
        <Card title="중고거래">
          <p className="text-gray-600 mb-4">
            안전하고 편리한 중고 물품 거래 플랫폼. 필요 없는 물건을 판매하고 필요한 물건을
            저렴하게 구매하세요.
          </p>
          <Link to="/marketplace">
            <Button variant="primary" className="w-full">
              둘러보기
            </Button>
          </Link>
        </Card>

        {/* 구독 커머스 카드 */}
        <Card title="구독 커머스">
          <p className="text-gray-600 mb-4">
            정기 배송 서비스로 편리함을 경험하세요. 매달 필요한 상품을 자동으로 받아보세요.
          </p>
          <Link to="/subscription">
            <Button variant="primary" className="w-full">
              둘러보기
            </Button>
          </Link>
        </Card>

        {/* 소셜 커머스 카드 */}
        <Card title="소셜 커머스">
          <p className="text-gray-600 mb-4">
            인플루언서가 추천하는 상품을 만나보세요. 라이브 커머스와 소셜 피드를 통한 쇼핑
            경험.
          </p>
          <Link to="/social">
            <Button variant="primary" className="w-full">
              둘러보기
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
