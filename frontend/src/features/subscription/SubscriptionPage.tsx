import Card from '../../shared/components/Card';

/**
 * SubscriptionPage 컴포넌트
 * - 역할: 구독 커머스 메인 페이지
 * - 기능: 구독 상품 목록 표시 (추후 구현)
 */
export default function SubscriptionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">구독 커머스</h1>
        <p className="text-gray-600">정기 배송으로 편리하게</p>
      </div>

      <Card title="구독 상품 목록">
        <p className="text-gray-500 text-center py-8">
          구독 커머스 기능이 곧 준비됩니다.
          <br />
          구독 플랜, 주기 설정, 결제 관리 기능이 추가될 예정입니다.
        </p>
      </Card>
    </div>
  );
}
