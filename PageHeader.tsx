import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  /** Override default navigate(-1) with a specific path */
  backTo?: string;
  /** Override the back action entirely */
  onBack?: () => void;
  /** Render anything extra to the right of the title */
  right?: React.ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  showBack = true,
  backTo,
  onBack,
  right,
}: PageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="flex items-center gap-3 w-full min-h-[44px]">
      {/* Back button */}
      {showBack && (
        <button
          onClick={handleBack}
          className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-secondary transition-colors flex-shrink-0"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
      )}

      {/* Title + subtitle */}
      <div className="flex-1 min-w-0">
        {title && (
          <h1 className="text-base font-semibold text-foreground leading-tight truncate">
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="text-xs text-muted-foreground leading-snug mt-0.5 truncate">
            {subtitle}
          </p>
        )}
      </div>

      {/* Right slot */}
      {right && <div className="flex-shrink-0">{right}</div>}
    </div>
  );
}
