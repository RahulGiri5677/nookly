import { Link } from "react-router-dom";

/**
 * Simple legal footer — used only on public/legal pages (Privacy, Terms, Auth).
 * Main app pages use NavTabBar via MobileLayout footer prop.
 */
export function AppFooter() {
  return (
    <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground py-1">
      <Link to="/privacy" className="hover:text-foreground transition-colors">
        Privacy Policy
      </Link>
      <span>·</span>
      <Link to="/terms" className="hover:text-foreground transition-colors">
        Terms of Service
      </Link>
    </div>
  );
}
