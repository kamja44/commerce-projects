import { Routes, Route } from 'react-router-dom';
import Layout from './shared/components/Layout';
import HomePage from './features/home/HomePage';
import MarketplacePage from './features/marketplace/MarketplacePage';
import SubscriptionPage from './features/subscription/SubscriptionPage';
import SocialPage from './features/social/SocialPage';

/**
 * App 컴포넌트
 * - 역할: 최상위 라우팅 설정
 * - 구조: Layout으로 감싸진 페이지들
 */
function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/subscription" element={<SubscriptionPage />} />
        <Route path="/social" element={<SocialPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
