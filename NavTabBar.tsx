import { useNavigate, useLocation } from "react-router-dom";
import { Home, Compass, BookMarked, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { hapticLight } from "@/lib/haptics";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";

const TABS = [
  { label: "Home",    icon: Home,       path: "/home" },
  { label: "Explore", icon: Compass,    path: "/explore" },
  { label: "My Nooks",icon: BookMarked, path: "/my-nooks" },
  { label: "Profile", icon: User,       path: "/profile" },
] as const;

export function NavTabBar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleTab = (path: string) => {
    hapticLight();
    if (location.pathname !== path) navigate(path);
  };

  return (
    <div className="flex items-stretch justify-around w-full">
      {TABS.map(({ label, icon: Icon, path }) => {
        const active = location.pathname === path ||
          (path === "/home" && location.pathname === "/");
        return (
          <button
            key={path}
            onClick={() => handleTab(path)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 py-2 px-1",
              "transition-all duration-200 active:scale-[0.92] focus:outline-none",
              "rounded-xl mx-0.5",
            )}
            aria-label={label}
          >
            <div className={cn(
              "w-10 h-6 flex items-center justify-center rounded-full transition-all duration-200",
              active && "bg-primary/14"
            )}>
              <Icon
                className={cn(
                  "transition-all duration-200",
                  active
                    ? "w-5 h-5 text-primary stroke-[2.2]"
                    : "w-[18px] h-[18px] text-muted-foreground stroke-[1.8]"
                )}
              />
            </div>
            <span className={cn(
              "text-[10px] leading-none font-medium transition-all duration-200",
              active ? "text-primary" : "text-muted-foreground opacity-70"
            )}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
