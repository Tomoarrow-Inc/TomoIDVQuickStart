// TomoIDV 모듈 - 모든 TomoIDV 관련 훅들을 네임스페이스로 제공
import { useWebhookConnection } from './hooks/useWebhookConnection';
import { usePopup, UsePopupReturn } from './hooks/usePopup';
import { useAssertion } from './hooks/useAssertion';

// TomoIDV 네임스페이스 객체
export const TomoIDV = {
  // Webhook 연결 관련 훅
  useTomoAuth: useWebhookConnection,
  // 팝업 관련 훅
  useTomoIDV: usePopup,
  // Client Credentials Token 발급 관련 훅
  useAssertion: useAssertion,
} as const;

// 기본 export로 TomoIDV 객체 제공
export default TomoIDV;

// 타입 export
export type { UseAssertionReturn, UseAssertionProps, IssueAccessTokenResult } from './types/assertion';
export type { UsePopupReturn } from './hooks/usePopup';
