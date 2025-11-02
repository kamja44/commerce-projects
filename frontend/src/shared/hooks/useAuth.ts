import { useState, useEffect } from 'react';
import { User } from '../types';

/**
 * 인증 Hook
 * - 역할: 사용자 인증 상태 관리
 * - 기능: 로그인, 로그아웃, 현재 사용자 정보
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 초기 로드 시 토큰 확인
    const token = localStorage.getItem('token');
    if (token) {
      // TODO: 토큰으로 사용자 정보 가져오기
      // fetchUser(token).then(setUser);
    }
    setIsLoading(false);
  }, []);

  /**
   * 로그인 함수
   */
  const login = (token: string, userData: User) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  /**
   * 로그아웃 함수
   */
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };
}
