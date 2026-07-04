import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { StickyNote, Sparkles, ArrowRight, Mail, Lock, User } from "lucide-react";
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

const STICKY_NOTES = [
  { color: "#FFE566", text: "Brainstorm ideas", rotate: -6, top: "12%", left: "8%" },
  { color: "#7BC8F6", text: "Map user flows", rotate: 4, top: "38%", left: "18%" },
  { color: "#FF9EAF", text: "Ship together", rotate: -3, top: "62%", left: "6%" },
  { color: "#B5EAD7", text: "Sticky notes!", rotate: 8, top: "22%", left: "52%" },
];

export default function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!agreed) {
      setError("Please accept the terms to continue.");
      return;
    }

    const users = getUsers();
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      setError("An account with this email already exists.");
      return;
    }

    setLoading(true);
    const newUser = { name: name.trim(), email: email.toLowerCase(), password };
    localStorage.setItem(USERS_KEY, JSON.stringify([...users, newUser]));
    setSession(newUser);

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

        {STICKY_NOTES.map((note) => (
          <div
            key={note.text}
            className="absolute w-36 h-36 rounded-sm shadow-[5px_7px_18px_rgba(0,0,0,0.12)] flex items-center justify-center p-4 text-center text-sm font-semibold text-[#1C1B1F]/80 select-none"
            style={{
              backgroundColor: note.color,
              top: note.top,
              left: note.left,
              transform: `rotate(${note.rotate}deg)`,
            }}
          >
            {note.text}
          </div>
        ))}

        <div className="relative z-10 max-w-md px-10 text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-semibold mb-6"
            style={{ background: "linear-gradient(135deg, #3742FA 0%, #7B61FF 100%)" }}
          >
            <Sparkles size={16} />
            Welcome to FigJam
          </div>
          <h1 className="text-4xl font-bold text-[#1C1B1F] leading-tight mb-4">
            Where teams think, plan &amp; create together
          </h1>
          <p className="text-[#7A7870] text-base leading-relaxed">
            Infinite canvas, sticky notes, shapes, and real-time collaboration — all in one place.
          </p>
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
            <h2 className="text-2xl font-bold text-[#1C1B1F] mb-2">Create your account</h2>
            <p className="text-[#7A7870] text-sm">
              Start collaborating on your first board in seconds.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A7870]" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-9 h-11"
                  autoComplete="name"
                />
              </div>
            </div>

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
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A7870]" />
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 h-11"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A7870]" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-9 h-11"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="flex items-start gap-2.5 pt-1">
              <Checkbox
                id="terms"
                checked={agreed}
                onCheckedChange={(v: boolean | "indeterminate") => setAgreed(v === true)}
                className="mt-0.5"
              />
              <label htmlFor="terms" className="text-sm text-[#7A7870] leading-snug cursor-pointer">
                I agree to the{" "}
                <span className="text-[#3742FA] font-medium hover:underline">Terms of Service</span>
                {" "}and{" "}
                <span className="text-[#3742FA] font-medium hover:underline">Privacy Policy</span>
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
              {loading ? "Creating account…" : "Create account"}
              {!loading && <ArrowRight size={18} />}
            </Button>
          </form>

          <p className="text-center text-sm text-[#7A7870] mt-8">
            Already have an account?{" "}
            <Link to="/login" className="text-[#3742FA] font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
