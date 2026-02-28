import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BackHeaderProps {
  /** Override default navigate(-1) with a specific path */
  to?: string;
  /** Override the back action entirely (e.g., toggling a step) */
  onBack?: () => void;
}

export function BackHeader({ to, onBack }: BackHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="flex items-center">
      <button
        onClick={handleBack}
        className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-secondary transition-colors"
        aria-label="Go back"
      >
        <ArrowLeft className="w-5 h-5 text-foreground" />
      </button>
    </div>
  );
}
