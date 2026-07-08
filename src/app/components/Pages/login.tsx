import { useState, useEffect, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { StickyNote, Sparkles, ArrowRight, Mail, Lock, Phone, ArrowLeft } from "lucide-react";
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

export default function Login() {
  const navigate = useNavigate();
  const [flow, setFlow] = useState<"initial" | "email-otp" | "phone-otp" | "password">("initial");
  const [email, setEmail] = useState("");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
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

  const handleSendEmailOtp = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    // TODO: Connect with backend API to send Email OTP code
    // Example:
    // await api.sendEmailOtp(email);
    console.log(`Sending Email OTP to: ${email}`);

    setTimeout(() => {
      setLoading(false);
      alert(`OTP has been sent to ${email} (Backend stub placeholder).`);
    }, 1000);
  };

  const handleSendPhoneOtp = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!phone || phone.length < 8) {
      setError("Please enter a valid phone number.");
      return;
    }

    setLoading(true);

    // TODO: Connect with backend API to send Phone OTP code
    // Example:
    // await api.sendPhoneOtp(countryCode + phone);
    console.log(`Sending Phone OTP to: ${countryCode} ${phone}`);

    setTimeout(() => {
      setLoading(false);
      alert(`OTP has been sent to ${countryCode} ${phone} (Backend stub placeholder).`);
    }, 1000);
  };

  const handlePasswordSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!emailOrPhone) {
      setError("Please enter your email or phone number.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailOrPhone);

    if (isEmail) {
      const users = getUsers();
      const user = users.find((u) => u.email.toLowerCase() === emailOrPhone.toLowerCase());

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

      // TODO: Connect with backend API for password authentication
      // Example:
      // await api.loginWithPassword(emailOrPhone, password);

      setTimeout(() => navigate("/", { replace: true }), 400);
    } else {
      // If it's a phone number or other value
      // TODO: Connect phone-based password login with backend API
      setError("Phone-based password login is not implemented in this frontend mockup. Please login using your email.");
    }
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

          {/* Flow rendering */}
          {flow === "initial" && (
            <div className="space-y-4">
              <Button
                type="button"
                disabled={loading}
                onClick={() => {
                  setError("");
                  setFlow("email-otp");
                }}
                className="w-full h-11 text-base font-semibold rounded-xl flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #3742FA 0%, #5B4FE8 100%)" }}
              >
                <Mail size={18} />
                Continue with Email
              </Button>
              <Button
                type="button"
                disabled={loading}
                onClick={() => {
                  setError("");
                  setFlow("phone-otp");
                }}
                className="w-full h-11 text-base font-semibold rounded-xl flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #3742FA 0%, #5B4FE8 100%)" }}
              >
                <Phone size={18} />
                Continue with Phone
              </Button>
            </div>
          )}

          {flow === "email-otp" && (
            <form onSubmit={handleSendEmailOtp} className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setFlow("initial");
                }}
                className="inline-flex items-center gap-1.5 text-xs text-[#3742FA] font-medium hover:underline mb-2"
              >
                <ArrowLeft size={14} />
                Back to sign-in options
              </button>

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
                    required
                  />
                </div>
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
                {loading ? "Sending OTP…" : "Send OTP"}
                {!loading && <ArrowRight size={18} />}
              </Button>
            </form>
          )}

          {flow === "phone-otp" && (
            <form onSubmit={handleSendPhoneOtp} className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setFlow("initial");
                }}
                className="inline-flex items-center gap-1.5 text-xs text-[#3742FA] font-medium hover:underline mb-2"
              >
                <ArrowLeft size={14} />
                Back to sign-in options
              </button>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex gap-2">
                  <div className="relative w-[100px] flex-shrink-0">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-full h-11 rounded-xl border border-black/[0.08] bg-white px-3 text-sm font-medium text-[#1C1B1F] focus:outline-none focus:ring-2 focus:ring-[#3742FA] appearance-none cursor-pointer"
                    >
                      <option value="+91">+91 (IN)</option>
                      <option value="+1">+1 (US)</option>
                      <option value="+44">+44 (UK)</option>
                      <option value="+971">+971 (AE)</option>
                      <option value="+61">+61 (AU)</option>
                      <option value="+81">+81 (JP)</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#7A7870] text-[10px]">
                      ▼
                    </div>
                  </div>
                  <div className="relative flex-grow">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A7870]" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      className="pl-9 h-11"
                      autoComplete="tel"
                      required
                    />
                  </div>
                </div>
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
                {loading ? "Sending OTP…" : "Send OTP"}
                {!loading && <ArrowRight size={18} />}
              </Button>
            </form>
          )}

          {flow === "password" && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setFlow("initial");
                }}
                className="inline-flex items-center gap-1.5 text-xs text-[#3742FA] font-medium hover:underline mb-2"
              >
                <ArrowLeft size={14} />
                Back to sign-in options
              </button>

              <div className="space-y-2">
                <Label htmlFor="emailOrPhone">Email or Phone Number</Label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A7870]" />
                  <Input
                    id="emailOrPhone"
                    type="text"
                    placeholder="you@company.com or +919876543210"
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    className="pl-9 h-11"
                    autoComplete="username"
                    required
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
                    required
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
          )}

          {flow !== "password" && (
            <>
              <div className="relative flex py-2 items-center my-6">
                <div className="flex-grow border-t border-black/[0.06]"></div>
                <span className="flex-shrink mx-4 text-[#7A7870] text-xs font-semibold uppercase tracking-wider">or</span>
                <div className="flex-grow border-t border-black/[0.06]"></div>
              </div>

              <div className="text-center space-y-3">
                <p className="text-sm text-[#7A7870]">Already have a password?</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setError("");
                    setFlow("password");
                  }}
                  className="w-full h-11 font-semibold border-black/[0.08] hover:bg-black/[0.02] text-[#1C1B1F] rounded-xl"
                >
                  Login with Password
                </Button>
              </div>
            </>
          )}

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
