import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="text-center space-y-4 max-w-sm">
        <p className="text-4xl">🌿</p>
        <h1 className="text-xl font-semibold text-foreground">Something went wrong.</h1>
        <p className="text-sm text-muted-foreground">
          It looks like this page had an issue. You can safely go back.
        </p>
        <div className="flex flex-col gap-2 mt-6">
          <Button variant="outline" onClick={() => navigate(-1)} className="w-full h-11 rounded-xl gap-2">
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
          <Button onClick={() => navigate("/home")} className="w-full h-11 rounded-xl gap-2">
            <Home className="w-4 h-4" />
            Go to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
