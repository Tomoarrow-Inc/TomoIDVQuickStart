// TomoIDV 모듈 - 모든 TomoIDV 관련 훅들을 네임스페이스로 제공
import { useWebhookConnection } from './hooks/useWebhookConnection';
import { usePopup } from './hooks/usePopup';
import { useEnvironment } from './hooks/useEnvironment';
import { verifySession } from './services/verifySession';
import { getResult } from './services/getResult';

// TomoIDV 네임스페이스 객체
export const TomoIDV = {
  // Webhook 연결 관련 훅
  useWebhookConnection,
  // 팝업 관련 훅
  usePopup,
  // 환경 초기화 관련 훅
  useEnvironment,
  // 서비스 함수들
  verifySession,
  getResult,
};

// 개별 훅들도 직접 export (기존 코드와의 호환성을 위해)
// export { useWebhookConnection } from './hooks/useWebhookConnection';
// export { usePopup } from './hooks/usePopup';

// 타입들도 export
// export type { UseWebhookConnectionProps } from './types/webhook';
// export type { ConnectionStatus } from './types/connectionStatus';

// 기본 export로 TomoIDV 객체 제공
export default TomoIDV;
