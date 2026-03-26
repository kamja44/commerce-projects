import Card from '@/shared/components/Card';

export const metadata = {
  title: '구독 커머스 | 통합 커머스 플랫폼',
  description: '정기 배송 서비스',
};

export default function SubscriptionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">구독 커머스</h1>
        <p className="text-gray-600">정기 배송 서비스로 편리함을 경험하세요</p>
      </div>

      <Card title="구독 상품 목록">
        <p className="text-gray-500 text-center py-8">
          구독 커머스 기능이 곧 준비됩니다.
        </p>
      </Card>
    </div>
  );
}
