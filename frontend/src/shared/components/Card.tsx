/**
 * Card Props
 */
interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

/**
 * 공통 Card 컴포넌트
 * - 역할: 콘텐츠를 카드 형태로 감싸는 컨테이너
 * - 기능: 제목, 커스텀 스타일링
 */
export default function Card({ children, title, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {title && <h3 className="text-xl font-semibold mb-4 text-gray-900">{title}</h3>}
      {children}
    </div>
  );
}
