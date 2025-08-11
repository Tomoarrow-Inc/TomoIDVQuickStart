import { TomoIDV } from "./modules/TomoIDV";

interface StartTomoIDVProps {
    session_id: string | null;
    className?: string;
    label?: string;
}

const StartTomoIDV = ({ session_id, className = '', label = 'Start Identity Verification' }: StartTomoIDVProps) => {
  const { openTomoIDVPopup } = TomoIDV.useTomoIDV();

  // 새로운 팝업 창 열기 함수
  const handleOpenIdvPopup = () => {
    if (!session_id) {
      console.error('Session ID is required to open IDV popup');
      return;
    }

    openTomoIDVPopup(session_id);
  };

  return (
    <button
      onClick={handleOpenIdvPopup}
      className={`${className} ${!session_id ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={!session_id}
    >
      {label}
    </button>
  );
}

export default StartTomoIDV;