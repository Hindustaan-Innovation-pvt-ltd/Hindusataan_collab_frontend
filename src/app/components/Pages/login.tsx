import { useState, useEffect, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { StickyNote, Sparkles, ArrowRight, Mail, Lock, Github } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";

const USERS_KEY = "figjam_users";
const SESSION_KEY = "figjam_session";

interface StoredUser {
  name: string;
  email: string;
  password: string;
}

function getUsers(): StoredUser[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

function setSession(user: Omit<StoredUser, "password">) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ name: user.name, email: user.email }));
}

const GoogleIcon = () => (
  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err) {
      setError(decodeURIComponent(err));
    }
  }, []);

  const handleOAuthLogin = (provider: "google" | "github") => {
    setLoading(true);
    window.location.href = `/auth/${provider}`;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    const users = getUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user || user.password !== password) {
      setError("Invalid email or password.");
      return;
    }

    setLoading(true);
    setSession({ name: user.name, email: user.email });

    if (!remember) {
      sessionStorage.setItem("figjam_ephemeral", "1");
    } else {
      sessionStorage.removeItem("figjam_ephemeral");
    }

    setTimeout(() => navigate("/", { replace: true }), 400);
  };

  return (
    <div
      className="min-h-screen w-full flex"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* Decorative panel */}
      <div
        className="hidden lg:flex lg:w-[52%] relative overflow-hidden items-center justify-center"
        style={{ backgroundColor: "#F0EEE8" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, #C0BEB6 1.3px, transparent 1.3px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative z-10 max-w-md px-10">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-semibold mb-6"
            style={{ background: "linear-gradient(135deg, #3742FA 0%, #7B61FF 100%)" }}
          >
            <Sparkles size={16} />
            FigJam
          </div>
          <h1 className="text-4xl font-bold text-[#1C1B1F] leading-tight mb-4">
            Pick up right where you left off
          </h1>
          <p className="text-[#7A7870] text-base leading-relaxed mb-10">
            Your boards, stickies, and sketches are waiting. Sign in to jump back in.
          </p>

          <div className="flex gap-3">
            {["#FFE566", "#7BC8F6", "#FF9EAF", "#B5EAD7", "#D4A1FF"].map((color) => (
              <div
                key={color}
                className="w-10 h-10 rounded-sm shadow-[3px_5px_12px_rgba(0,0,0,0.1)]"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 bg-white">
        <div className="w-full max-w-[420px]">
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
              style={{ background: "linear-gradient(135deg, #3742FA 0%, #7B61FF 100%)" }}
            >
              <StickyNote size={20} />
            </div>
            <span className="text-xl font-bold text-[#1C1B1F]">FigJam</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#1C1B1F] mb-2">Welcome back</h2>
            <p className="text-[#7A7870] text-sm">
              Sign in to access your boards and keep collaborating.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => handleOAuthLogin("google")}
              className="h-11 font-semibold flex items-center justify-center border-black/[0.08] hover:bg-black/[0.02] text-[#1C1B1F] rounded-xl"
            >
              <GoogleIcon />
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => handleOAuthLogin("github")}
              className="h-11 font-semibold flex items-center justify-center border-black/[0.08] hover:bg-black/[0.02] text-[#1C1B1F] rounded-xl"
            >
              <Github size={18} className="mr-2 text-[#1C1B1F]" />
              GitHub
            </Button>
          </div>

          <div className="relative flex py-2 items-center mb-6">
            <div className="flex-grow border-t border-black/[0.06]"></div>
            <span className="flex-shrink mx-4 text-[#7A7870] text-xs font-semibold uppercase tracking-wider">or continue with</span>
            <div className="flex-grow border-t border-black/[0.06]"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A7870]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-11"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  className="text-xs text-[#3742FA] font-medium hover:underline"
                  onClick={() => setError("Password reset is not available in this demo.")}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A7870]" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 h-11"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <Checkbox
                id="remember"
                checked={remember}
                onCheckedChange={(v) => setRemember(v === true)}
              />
              <label htmlFor="remember" className="text-sm text-[#7A7870] cursor-pointer">
                Remember me
              </label>
            </div>

            {error && (
              <p className="text-sm text-[#FF4757] font-medium bg-[#FF4757]/8 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 text-base font-semibold rounded-xl mt-2"
              style={{ background: loading ? undefined : "linear-gradient(135deg, #3742FA 0%, #5B4FE8 100%)" }}
            >
              {loading ? "Signing in…" : "Sign in"}
              {!loading && <ArrowRight size={18} />}
            </Button>
          </form>

          <p className="text-center text-sm text-[#7A7870] mt-8">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="text-[#3742FA] font-semibold hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
