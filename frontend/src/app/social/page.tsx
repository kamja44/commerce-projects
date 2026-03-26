import Card from '@/shared/components/Card';

export const metadata = {
  title: '소셜 커머스 | 통합 커머스 플랫폼',
  description: '인플루언서 추천 상품',
};

export default function SocialPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">소셜 커머스</h1>
        <p className="text-gray-600">인플루언서가 추천하는 상품을 만나보세요</p>
      </div>

      <Card title="소셜 상품 목록">
        <p className="text-gray-500 text-center py-8">
          소셜 커머스 기능이 곧 준비됩니다.
        </p>
      </Card>
    </div>
  );
}
