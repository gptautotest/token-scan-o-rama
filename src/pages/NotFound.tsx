
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md p-8">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-solana to-solana-secondary bg-clip-text text-transparent">404</h1>
        <p className="text-xl mt-4 mb-6">Oops! The page you're looking for does not exist.</p>
        <a href="/" className="inline-block px-6 py-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
