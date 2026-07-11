import { Link } from "react-router";
import { Sparkles, UserPlus, LogIn } from "lucide-react";
import { Button } from "../ui/button";

export default function Welcome() {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-background"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-50 dark:opacity-20"
        style={{
          backgroundImage: "radial-gradient(circle, var(--color-muted-foreground) 1.3px, transparent 1.3px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 w-full max-w-md px-6 py-12 bg-card rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.08)] flex flex-col items-center text-center">
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-semibold mb-6 shadow-md"
          style={{ background: "linear-gradient(135deg, #3742FA 0%, #7B61FF 100%)" }}
        >
          <Sparkles size={16} />
          HIXCanvas
        </div>

        <h1 className="text-3xl font-bold text-foreground leading-tight mb-3">
          Welcome to HIXCanvas
        </h1>
        <p className="text-muted-foreground text-sm mb-10 px-4">
          Where teams think, plan & create together. Choose how you want to proceed.
        </p>

        <div className="w-full space-y-4">
          <Link to="/signup" className="block w-full">
            <Button
              type="button"
              className="w-full h-14 text-lg font-bold rounded-2xl flex items-center justify-center gap-2 text-white shadow-[0_4px_14px_rgba(55,66,250,0.3)] hover:shadow-[0_6px_20px_rgba(55,66,250,0.4)] transition-all hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg, #3742FA 0%, #5B4FE8 100%)" }}
            >
              <UserPlus size={20} />
              Registration
            </Button>
          </Link>

          <Link to="/login" className="block w-full">
            <Button
              type="button"
              variant="outline"
              className="w-full h-14 text-lg font-bold rounded-2xl flex items-center justify-center gap-2 border-2 border-border hover:bg-muted text-foreground transition-all hover:-translate-y-0.5"
            >
              <LogIn size={20} />
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
