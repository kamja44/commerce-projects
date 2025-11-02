import Card from '../../shared/components/Card';

/**
 * SocialPage 컴포넌트
 * - 역할: 소셜 커머스 메인 페이지
 * - 기능: 소셜 피드 및 라이브 커머스 (추후 구현)
 */
export default function SocialPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">소셜 커머스</h1>
        <p className="text-gray-600">인플루언서와 함께하는 쇼핑</p>
      </div>

      <Card title="소셜 피드">
        <p className="text-gray-500 text-center py-8">
          소셜 커머스 기능이 곧 준비됩니다.
          <br />
          라이브 커머스, 인플루언서 추천, 소셜 피드 기능이 추가될 예정입니다.
        </p>
      </Card>
    </div>
  );
}
