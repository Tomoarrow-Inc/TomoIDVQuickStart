import { config, EnvironmentErrorBoundary } from "./ClientEnv";

interface StartTomoIDVProps {
    session_id: string | null;
    className?: string;
    label?: string;
}

const StartTomoIDV = ({ session_id, className = '', label = 'Start Identity Verification' }: StartTomoIDVProps) => {

  // 새로운 팝업 창 열기 함수
  const openIdvPopup = () => {
    if (!session_id) {
      console.error('Session ID is required to open IDV popup');
      return;
    }

    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    // session_id를 쿼리 스트링으로 추가
    const url = `${config.tomoIdvAppUrl}?sessionId=${encodeURIComponent(session_id)}`;

    // 팝업 창 열기
    const popup = window.open(
      url,
      'TomoIDV',
      `width=${width},height=${height},left=${left},top=${top},popup=1,noopener,noreferrer,scrollbars=yes,resizable=yes`
    );

    console.log(`IDV popup opened with session ID: ${session_id}`);
  };

  return (
    <EnvironmentErrorBoundary>

    {/* IDV 팝업 버튼 */}
    <button
      onClick={openIdvPopup}
      className={`${className} ${!session_id ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={!session_id}
      >
        {label}
      </button>
    </EnvironmentErrorBoundary>
  );
}

export default StartTomoIDV;