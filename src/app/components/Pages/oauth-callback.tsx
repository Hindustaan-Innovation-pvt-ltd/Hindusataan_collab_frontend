import { useEffect } from "react";
import { useNavigate } from "react-router";
import { Loader2 } from "lucide-react";

export default function OauthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const name = params.get("name");
    const email = params.get("email");

    if (name && email) {
      localStorage.setItem(
        "HIXCanvas_session",
        JSON.stringify({
          name: decodeURIComponent(name),
          email: decodeURIComponent(email),
          token: token || ""
        })
      );
      // Success redirect
      navigate("/", { replace: true });
    } else {
      // Error redirect
      const error = params.get("error") || "Authentication failed. Please try again.";
      navigate(`/login?error=${encodeURIComponent(error)}`, { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background relative">
      <div
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          backgroundImage: "radial-gradient(circle, #C0BEB6 1.3px, transparent 1.3px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="z-10 flex flex-col items-center gap-4 bg-card p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border">
        <Loader2 className="animate-spin text-[#3742FA]" size={36} />
        <h2 className="text-xl font-bold text-foreground">Completing login...</h2>
        <p className="text-sm text-muted-foreground">Please wait while we finalize your account.</p>
      </div>
    </div>
  );
}
