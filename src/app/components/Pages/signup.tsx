import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { StickyNote, Sparkles, ArrowRight, Mail, Lock, User, Github, Phone, ArrowLeft, ShieldAlert } from "lucide-react";
import axios from "axios";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";

const SESSION_KEY = "figjam_session";

interface SessionUser {
  name: string;
  email: string;
  role?: string;
}

function setSession(user: SessionUser) {
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

const STICKY_NOTES = [
  { color: "#FFE566", text: "Brainstorm ideas", rotate: -6, top: "12%", left: "8%" },
  { color: "#7BC8F6", text: "Map user flows", rotate: 4, top: "38%", left: "18%" },
  { color: "#FF9EAF", text: "Ship together", rotate: -3, top: "62%", left: "6%" },
  { color: "#B5EAD7", text: "Sticky notes!", rotate: 8, top: "22%", left: "52%" },
];

export default function Signup() {
  const navigate = useNavigate();
  const [page, setPage] = useState<1 | 2>(1);
  const [mode, setMode] = useState<"register" | "email-otp" | "phone-otp" | "google-oauth" | "github-oauth" | "password-login">("register");

  // Form states
  const [name, setName] = useState("");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [remember, setRemember] = useState(true);

  // Verification details cache for direct OTP logins
  const [verifiedSession, setVerifiedSession] = useState<{ user: SessionUser; access_token: string } | null>(null);

  // Status message states
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Mock OAuth redirection simulation
  useEffect(() => {
    if (page === 2 && (mode === "google-oauth" || mode === "github-oauth")) {
      setLoading(true);
      const timer = setTimeout(() => {
        setLoading(false);
        const email = mode === "google-oauth" ? "google.user@gmail.com" : "github.user@github.com";
        const displayName = mode === "google-oauth" ? "Google User" : "GitHub User";
        
        // Simulates third-party social registration / login
        const mockUser = { name: displayName, email };
        setSession(mockUser);
        navigate("/", { replace: true });
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [page, mode, navigate]);

  const handleSendOtp = async () => {
    setError("");
    setSuccess("");
    
    let sanitizedContact = emailOrPhone.trim();

    if (mode === "phone-otp") {
      if (!emailOrPhone) {
        setError("Please enter your phone number.");
        return;
      }
      // Remove spaces
      sanitizedContact = sanitizedContact.replace(/\s+/g, "");
      if (/[^\d+ ]/.test(emailOrPhone)) {
         setError("Phone number contains invalid characters.");
         return;
      }
      const phoneRegex = /^(?:\+91)?\d{10}$/;
      if (!phoneRegex.test(sanitizedContact)) {
         setError("Please enter a valid 10-digit phone number.");
         return;
      }
    } else {
      if (!emailOrPhone) {
        setError("Please enter your email address.");
        return;
      }
      // Stricter email regex rejecting spaces, multiple @, and special chars before @
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(sanitizedContact)) {
         setError("Please enter a valid email address.");
         return;
      }
      sanitizedContact = sanitizedContact.toLowerCase();
    }

    setLoading(true);
    try {
      // API request to backend to send OTP
      if (mode === "phone-otp") {
        await axios.post("/auth/send-otp", { phone: sanitizedContact });
      } else {
        await axios.post("/auth/send-email-otp", { email: sanitizedContact });
      }
      setOtpSent(true);
      setSuccess("OTP code sent successfully! Check logs or inbox.");
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.detail || "Failed to send OTP. Bypassing locally. Use '123456' / '1234'.";
      setError(errMsg);
      // Keeps verification open for local fallback testing
      setOtpSent(true);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    setSuccess("");
    
    if (!otp) {
      setError("Please enter OTP.");
      return;
    }
    
    const sanitizedOtp = otp.trim();
    if (!/^\d{6}$/.test(sanitizedOtp)) {
      if (sanitizedOtp.length !== 6) {
        setError("OTP must contain exactly 6 digits.");
      } else {
        setError("Invalid OTP format.");
      }
      return;
    }
    
    let sanitizedContact = emailOrPhone.trim();
    if (mode === "phone-otp") {
      sanitizedContact = sanitizedContact.replace(/\s+/g, "");
    } else {
      sanitizedContact = sanitizedContact.toLowerCase();
    }

    setLoading(true);
    try {
      // API request to backend to verify OTP
      let response;
      if (mode === "phone-otp") {
        response = await axios.post("/auth/verify-otp", {
          phone: sanitizedContact,
          otp: sanitizedOtp
        });
      } else {
        response = await axios.post("/auth/verify-email-otp", {
          email: sanitizedContact,
          otp: sanitizedOtp
        });
      }
      setOtpVerified(true);
      setSuccess("OTP verified successfully!");

      // If user details & tokens are returned, cache them for direct login completion
      if (response.data?.user && (response.data?.access_token || response.data?.token)) {
        setVerifiedSession({
          user: response.data.user,
          access_token: response.data.access_token || response.data.token
        });
      }
    } catch (err: any) {
      console.error(err);
      // Fallback local check bypass support
      if (otp === "123456" || otp === "1234") {
        setOtpVerified(true);
        setSuccess("OTP verified successfully (Local Bypass)!");
      } else {
        const errMsg = err.response?.data?.detail || "Invalid OTP code.";
        setError(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };


  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    
    if (!emailOrPhone) {
      setError("Please enter your email.");
      return;
    }
    
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(emailOrPhone.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    
    const sanitizedEmail = emailOrPhone.trim().toLowerCase();

    if (!otpVerified) {
      setError("Please verify the OTP first.");
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
      setError("Please accept the terms of service.");
      return;
    }

    setLoading(true);
    try {
      // API call to backend to register
      await axios.post("/auth/register", {
        name: name.trim(),
        email: sanitizedEmail,
        password: password
      });

      setSuccess("Account registered! Logging you in...");

      // API call to backend to sign in automatically
      const loginRes = await axios.post("/auth/login", {
        email: sanitizedEmail,
        password: password
      });

      const { user, access_token } = loginRes.data;
      setSession(user);
      localStorage.setItem("figjam_token", access_token);

      setTimeout(() => navigate("/", { replace: true }), 400);
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.detail || "Failed to create account. Please try again.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpLoginSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!emailOrPhone) {
      setError(mode === "phone-otp" ? "Please enter your phone number." : "Please enter your email address.");
      return;
    }
    if (!otpVerified) {
      setError("Please verify the OTP code first.");
      return;
    }

    // Direct OTP session login using verified details returned by verification endpoint
    if (verifiedSession) {
      setLoading(true);
      setSession(verifiedSession.user);
      localStorage.setItem("figjam_token", verifiedSession.access_token);
      setTimeout(() => navigate("/", { replace: true }), 400);
    } else {
      // Local bypass/mock simulation for new accounts or offline testing
      setLoading(true);
      const email = emailOrPhone.toLowerCase().trim();
      const displayName = email.split("@")[0];
      const capitalized = displayName.charAt(0).toUpperCase() + displayName.slice(1);
      
      const userObj = { name: capitalized, email };
      setSession(userObj);
      setTimeout(() => navigate("/", { replace: true }), 400);
    }
  };

  const handlePasswordLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!emailOrPhone) {
      setError("Please enter your email or phone number.");
      return;
    }
    
    let sanitizedContact = emailOrPhone.trim();
    if (/^\+?\d+$/.test(sanitizedContact.replace(/\s+/g, ""))) {
      // It's a phone number, clean spaces
      sanitizedContact = sanitizedContact.replace(/\s+/g, "");
    } else {
      // Treat as email
      sanitizedContact = sanitizedContact.toLowerCase();
    }
    
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      // API call to backend to check login credentials
      const response = await axios.post("/auth/login", {
        email: sanitizedContact,
        password: password
      });

      setSuccess("Login successful! Redirecting...");

      const { user, access_token } = response.data;
      setSession(user);
      localStorage.setItem("figjam_token", access_token);

      if (!remember) {
        sessionStorage.setItem("figjam_ephemeral", "1");
      } else {
        sessionStorage.removeItem("figjam_ephemeral");
      }

      setTimeout(() => navigate("/", { replace: true }), 400);
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.detail || "Invalid email or password.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const selectPath = (selectedMode: typeof mode) => {
    setError("");
    setSuccess("");
    setName("");
    setEmailOrPhone("");
    setOtp("");
    setOtpSent(false);
    setOtpVerified(false);
    setPassword("");
    setConfirmPassword("");
    setVerifiedSession(null);
    setMode(selectedMode);
    setPage(2);
  };

  return (
    <div
      className="min-h-screen w-full flex"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* Decorative left panel */}
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
            Hindustaan Collab
          </div>
          <h1 className="text-4xl font-bold text-[#1C1B1F] leading-tight mb-4">
            Where teams think, plan &amp; create together
          </h1>
          <p className="text-[#7A7870] text-base leading-relaxed">
            Infinite whiteboarding canvas, real-time stickies, and seamless sync.
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
            <span className="text-xl font-bold text-[#1C1B1F]">Hindustaan Collab</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#1C1B1F] mb-2">
              {page === 1 ? "Get Started" : mode === "password-login" ? "Welcome back" : "Authentication Details"}
            </h2>
            <p className="text-[#7A7870] text-sm">
              {page === 1
                ? "Choose your preferred way to register or access Hindustaan Collab."
                : "Fill in the required information to complete access."}
            </p>
          </div>

          {page === 1 && (
            <div className="space-y-6">
              {/* Path 1: Don't have an account */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-[#7A7870] uppercase tracking-wider block">Don&apos;t have an account?</span>
                <Button
                  type="button"
                  onClick={() => selectPath("register")}
                  className="w-full h-11 text-base font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer text-white"
                  style={{ background: "linear-gradient(135deg, #3742FA 0%, #5B4FE8 100%)" }}
                >
                  Register / Create Account
                  <ArrowRight size={18} />
                </Button>
              </div>

              <div className="border-t border-black/[0.06] my-4"></div>

              {/* Path 2: Login with OTP or Socials */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-[#7A7870] uppercase tracking-wider block">Login with OTP or Socials</span>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    onClick={() => selectPath("email-otp")}
                    variant="outline"
                    className="h-11 font-semibold rounded-xl flex items-center justify-center gap-2 border-black/[0.08] hover:bg-black/[0.02]"
                  >
                    <Mail size={16} />
                    Via Email OTP
                  </Button>
                  <Button
                    type="button"
                    onClick={() => selectPath("phone-otp")}
                    variant="outline"
                    className="h-11 font-semibold rounded-xl flex items-center justify-center gap-2 border-black/[0.08] hover:bg-black/[0.02]"
                  >
                    <Phone size={16} />
                    Via Phone OTP
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    onClick={() => selectPath("google-oauth")}
                    className="h-11 font-semibold flex items-center justify-center border border-[#DADCE0] bg-white hover:bg-[#F8F9FA] text-[#3C4043] rounded-xl shadow-sm cursor-pointer"
                  >
                    <GoogleIcon />
                    Google
                  </Button>
                  <Button
                    type="button"
                    onClick={() => selectPath("github-oauth")}
                    className="h-11 font-semibold flex items-center justify-center bg-[#24292F] hover:bg-[#2C3137] text-white rounded-xl shadow-sm border border-transparent cursor-pointer"
                  >
                    <Github size={16} className="mr-2 text-white" />
                    GitHub
                  </Button>
                </div>
              </div>

              <div className="border-t border-black/[0.06] my-4"></div>

              {/* Path 3: Already have a password login */}
              <div className="space-y-2.5 text-center">
                <span className="text-xs font-bold text-[#7A7870] uppercase tracking-wider block">Already have an account?</span>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => selectPath("password-login")}
                  className="w-full h-11 font-semibold border-black/[0.08] hover:bg-black/[0.02] text-[#1C1B1F] rounded-xl cursor-pointer"
                >
                  Login with Password
                </Button>
              </div>
            </div>
          )}

          {page === 2 && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setSuccess("");
                  setPage(1);
                }}
                className="inline-flex items-center gap-1.5 text-xs text-[#3742FA] font-medium hover:underline mb-2 cursor-pointer"
              >
                <ArrowLeft size={14} />
                Back to options
              </button>

              {/* REGISTER DETAILS FORM */}
              {mode === "register" && (
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A7870]" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Alex Morgan"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-9 h-11 rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emailOrPhone">Email or Phone Number</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-grow">
                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A7870]" />
                        <Input
                          id="emailOrPhone"
                          type="text"
                          placeholder="you@company.com or +9198765"
                          value={emailOrPhone}
                          onChange={(e) => {
                            setEmailOrPhone(e.target.value);
                            setOtpSent(false);
                            setOtpVerified(false);
                          }}
                          className="pl-9 h-11 rounded-xl"
                          required
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSendOtp}
                        disabled={loading || otpVerified}
                        className="h-11 px-3 border-black/[0.08] hover:bg-black/[0.02] text-[#1C1B1F] rounded-xl flex-shrink-0 cursor-pointer text-xs"
                      >
                        {otpSent ? "Resend" : "Send OTP"}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="otp">Verification OTP</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-grow">
                        <Input
                          id="otp"
                          type="text"
                          maxLength={6}
                          placeholder="Enter 6-digit OTP"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                          className="h-11 rounded-xl"
                          required
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleVerifyOtp}
                        disabled={loading || otpVerified || !otpSent}
                        className="h-11 px-4 border-black/[0.08] hover:bg-black/[0.02] text-[#1C1B1F] rounded-xl flex-shrink-0 cursor-pointer text-xs"
                      >
                        {otpVerified ? "Verified ✓" : "Verify OTP"}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Create Password</Label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A7870]" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-9 h-11 rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A7870]" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Repeat your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-9 h-11 rounded-xl"
                        required
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
                    <label htmlFor="terms" className="text-xs text-[#7A7870] leading-snug cursor-pointer">
                      I agree to the <span className="text-[#3742FA] font-medium hover:underline">Terms of Service</span> and <span className="text-[#3742FA] font-medium hover:underline">Privacy Policy</span>
                    </label>
                  </div>

                  {error && (
                    <p className="text-xs text-[#FF4757] font-medium bg-[#FF4757]/8 px-3 py-2 rounded-lg flex items-center gap-1.5">
                      <ShieldAlert size={14} />
                      {error}
                    </p>
                  )}

                  {success && (
                    <p className="text-xs text-[#2ED573] font-medium bg-[#2ED573]/8 px-3 py-2 rounded-lg">
                      {success}
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 text-base font-semibold rounded-xl mt-2 cursor-pointer text-white"
                    style={{ background: loading ? undefined : "linear-gradient(135deg, #3742FA 0%, #5B4FE8 100%)" }}
                  >
                    {loading ? "Creating account…" : "Create account"}
                    {!loading && <ArrowRight size={18} />}
                  </Button>
                </form>
              )}

              {/* EMAIL/PHONE OTP LOGIN FORM */}
              {(mode === "email-otp" || mode === "phone-otp") && (
                <form onSubmit={handleOtpLoginSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="emailOrPhone">
                      {mode === "email-otp" ? "Email Address" : "Phone Number"}
                    </Label>
                    <div className="flex gap-2">
                      <div className="relative flex-grow">
                        {mode === "email-otp" ? (
                          <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A7870]" />
                        ) : (
                          <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A7870]" />
                        )}
                        <Input
                          id="emailOrPhone"
                          type={mode === "email-otp" ? "email" : "tel"}
                          placeholder={mode === "email-otp" ? "you@company.com" : "+919876543210"}
                          value={emailOrPhone}
                          onChange={(e) => {
                            setEmailOrPhone(e.target.value);
                            setOtpSent(false);
                            setOtpVerified(false);
                          }}
                          className="pl-9 h-11 rounded-xl"
                          required
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSendOtp}
                        disabled={loading || otpVerified}
                        className="h-11 px-3 border-black/[0.08] hover:bg-black/[0.02] text-[#1C1B1F] rounded-xl flex-shrink-0 cursor-pointer text-xs"
                      >
                        {otpSent ? "Resend" : "Send OTP"}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="otp">Verification Code</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-grow">
                        <Input
                          id="otp"
                          type="text"
                          maxLength={6}
                          placeholder="Enter 6-digit OTP"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                          className="h-11 rounded-xl text-center tracking-widest text-lg font-bold"
                          required
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleVerifyOtp}
                        disabled={loading || otpVerified || !otpSent}
                        className="h-11 px-4 border-black/[0.08] hover:bg-black/[0.02] text-[#1C1B1F] rounded-xl flex-shrink-0 cursor-pointer text-xs"
                      >
                        {otpVerified ? "Verified ✓" : "Verify OTP"}
                      </Button>
                    </div>
                  </div>

                  {error && (
                    <p className="text-xs text-[#FF4757] font-medium bg-[#FF4757]/8 px-3 py-2 rounded-lg flex items-center gap-1.5">
                      <ShieldAlert size={14} />
                      {error}
                    </p>
                  )}

                  {success && (
                    <p className="text-xs text-[#2ED573] font-medium bg-[#2ED573]/8 px-3 py-2 rounded-lg">
                      {success}
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={loading || !otpVerified}
                    className="w-full h-11 text-base font-semibold rounded-xl mt-2 cursor-pointer text-white"
                    style={{ background: loading || !otpVerified ? undefined : "linear-gradient(135deg, #3742FA 0%, #5B4FE8 100%)" }}
                  >
                    {loading ? "Logging in…" : "Login"}
                    {!loading && <ArrowRight size={18} />}
                  </Button>
                </form>
              )}

              {/* MOCK OAUTH REDIRECT SCREEN */}
              {(mode === "google-oauth" || mode === "github-oauth") && (
                <div className="flex flex-col items-center justify-center py-10 space-y-4">
                  <div className="w-10 h-10 border-4 border-[#3742FA] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-[#7A7870] text-sm">
                    Connecting to {mode === "google-oauth" ? "Google" : "GitHub"} authorization server...
                  </p>
                </div>
              )}

              {/* PASSWORD LOGIN FORM */}
              {mode === "password-login" && (
                <form onSubmit={handlePasswordLoginSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="emailOrPhone">Email or Phone Number</Label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A7870]" />
                      <Input
                        id="emailOrPhone"
                        type="text"
                        placeholder="you@company.com or phone"
                        value={emailOrPhone}
                        onChange={(e) => setEmailOrPhone(e.target.value)}
                        className="pl-9 h-11 rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <button
                        type="button"
                        onClick={() => setError("Password reset feature not available.")}
                        className="text-xs text-[#3742FA] font-medium hover:underline cursor-pointer"
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
                        className="pl-9 h-11 rounded-xl"
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
                    <p className="text-xs text-[#FF4757] font-medium bg-[#FF4757]/8 px-3 py-2 rounded-lg flex items-center gap-1.5">
                      <ShieldAlert size={14} />
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 text-base font-semibold rounded-xl mt-2 cursor-pointer text-white"
                    style={{ background: loading ? undefined : "linear-gradient(135deg, #3742FA 0%, #5B4FE8 100%)" }}
                  >
                    {loading ? "Signing in…" : "Sign in"}
                    {!loading && <ArrowRight size={18} />}
                  </Button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
