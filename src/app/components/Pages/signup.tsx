import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { Sparkles, ArrowRight, Mail, Lock, User, ShieldAlert, ArrowLeft, CheckCircle2, Eye, EyeOff, ShieldCheck, Check } from "lucide-react";
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

const STICKY_NOTES = [
  { color: "#FFE566", text: "Brainstorm ideas", rotate: -6, top: "12%", left: "8%" },
  { color: "#7BC8F6", text: "Map user flows", rotate: 4, top: "38%", left: "18%" },
  { color: "#FF9EAF", text: "Ship together", rotate: -3, top: "62%", left: "6%" },
  { color: "#B5EAD7", text: "Sticky notes!", rotate: 8, top: "22%", left: "52%" },
];

export default function Signup() {
  const navigate = useNavigate();

  // Wizard state
  const [step, setStep] = useState(1);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status message states
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Validation & Navigation
  const handleStep1Next = () => {
    setError("");
    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!email) {
      setError("Please enter your email.");
      return;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    setStep(2);
  };

  const handleStep2Next = () => {
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setStep(3);
  };

  const handleBack = () => {
    setError("");
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleRegisterSubmit = async () => {
    setError("");

    if (!agreed) {
      setError("Please accept the terms of service.");
      return;
    }

    setLoading(true);
    try {
      const sanitizedEmail = email.trim().toLowerCase();
      // Reuse the existing Registration API
      await axios.post("/auth/register", {
        name: name.trim(),
        email: sanitizedEmail,
        password: password
      });

      // On success, show the success screen
      setStep(4);
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.detail || "Failed to create account. Please try again.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Helper to determine password strength color
  const getPasswordStrengthColor = () => {
    if (password.length === 0) return "bg-gray-200";
    if (password.length < 6) return "bg-red-400";
    if (password.length < 10) return "bg-yellow-400";
    return "bg-green-500";
  };
  
  const getPasswordStrengthText = () => {
    if (password.length === 0) return "";
    if (password.length < 6) return "Weak";
    if (password.length < 10) return "Medium";
    return "Strong";
  };

  return (
    <div
      className="min-h-screen w-full flex bg-white"
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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-semibold mb-6 shadow-md"
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
        <div className="w-full max-w-[440px] px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            {step === 1 ? (
              <Link to="/welcome" className="inline-flex items-center gap-1.5 text-xs text-[#3742FA] font-semibold hover:underline">
                <ArrowLeft size={14} /> Back to Welcome
              </Link>
            ) : step < 4 ? (
              <button onClick={handleBack} className="inline-flex items-center gap-1.5 text-xs text-[#3742FA] font-semibold hover:underline">
                <ArrowLeft size={14} /> Back to Welcome
              </button>
            ) : (
              <Link to="/welcome" className="inline-flex items-center gap-1.5 text-xs text-[#3742FA] font-semibold hover:underline">
                <ArrowLeft size={14} /> Back to Welcome
              </Link>
            )}
            <div className="text-xs font-bold text-[#3742FA]">Step {step} of 4</div>
          </div>

          {/* Step Indicator Circles */}
          <div className="relative flex justify-between items-center mb-10 w-[85%] mx-auto z-0">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-gray-200 -z-10"></div>
            {[1, 2, 3, 4].map(s => {
              const isCompleted = step > s || (step === 4 && s === 4);
              const isCurrent = step === s && step !== 4;
              return (
                <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${isCompleted ? 'bg-[#3742FA] text-white shadow-[0_0_0_4px_white]' : isCurrent ? 'bg-[#3742FA] text-white shadow-[0_0_0_4px_white]' : 'bg-white border-2 border-gray-200 text-gray-400'}`}>
                  {isCompleted ? <Check size={16} strokeWidth={3} /> : s}
                </div>
              )
            })}
          </div>

          {/* STEP 1: Basic Information */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="mb-8">
                <h2 className="text-[28px] font-bold text-[#1C1B1F] mb-1.5 tracking-tight">Create Account</h2>
                <p className="text-[#7A7870] text-[15px]">
                  Let's start with your basic information.
                </p>
              </div>

              <div className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-[13px] font-bold text-[#1C1B1F]">Full Name</Label>
                  <div className="relative">
                    <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" strokeWidth={2} />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 h-12 rounded-xl border-gray-200 text-[15px] placeholder:text-gray-400 focus-visible:ring-[#3742FA] focus-visible:border-[#3742FA]"
                      autoFocus
                    />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-[13px] font-bold text-[#1C1B1F]">Email</Label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" strokeWidth={2} />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 rounded-xl border-gray-200 text-[15px] placeholder:text-gray-400 focus-visible:ring-[#3742FA] focus-visible:border-[#3742FA]"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-[#FF4757] font-medium bg-[#FF4757]/8 px-3 py-2 rounded-lg">
                    {error}
                  </p>
                )}

                <Button
                  type="button"
                  onClick={handleStep1Next}
                  className="w-full h-12 text-[15px] font-semibold rounded-xl mt-6 shadow-sm bg-[#3742FA] hover:bg-[#2B34C8] text-white transition-all hover:-translate-y-0.5"
                >
                  Next <ArrowRight size={18} className="ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Password */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="mb-8">
                <h2 className="text-[28px] font-bold text-[#1C1B1F] mb-1.5 tracking-tight">Create Password</h2>
                <p className="text-[#7A7870] text-[15px]">
                  Create a secure password for your account.
                </p>
              </div>

              <div className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-[13px] font-bold text-[#1C1B1F]">Create Password</Label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" strokeWidth={2} />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-12 rounded-xl border-gray-200 text-[15px] placeholder:text-gray-400 focus-visible:ring-[#3742FA] focus-visible:border-[#3742FA]"
                      autoFocus
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
                    </button>
                  </div>
                  {/* Visual Password Strength Indicator */}
                  <div className="flex items-center gap-2 mt-2 px-1">
                    <span className="text-[11px] font-semibold text-gray-500">Password strength:</span>
                    <span className="text-[11px] font-bold text-gray-700">{getPasswordStrengthText()}</span>
                    <div className="flex gap-1 h-1.5 ml-2 w-24">
                      <div className={`flex-1 rounded-full transition-colors ${password.length > 0 ? getPasswordStrengthColor() : "bg-gray-200"}`} />
                      <div className={`flex-1 rounded-full transition-colors ${password.length >= 6 ? getPasswordStrengthColor() : "bg-gray-200"}`} />
                      <div className={`flex-1 rounded-full transition-colors ${password.length >= 10 ? getPasswordStrengthColor() : "bg-gray-200"}`} />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-[13px] font-bold text-[#1C1B1F]">Confirm Password</Label>
                  <div className="relative">
                    <ShieldCheck size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" strokeWidth={2} />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-10 h-12 rounded-xl border-gray-200 text-[15px] placeholder:text-gray-400 focus-visible:ring-[#3742FA] focus-visible:border-[#3742FA]"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-[#FF4757] font-medium bg-[#FF4757]/8 px-3 py-2 rounded-lg">
                    {error}
                  </p>
                )}

                <div className="flex gap-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1 h-12 text-[15px] font-semibold rounded-xl border-gray-200 text-[#1C1B1F] shadow-sm hover:bg-gray-50 transition-all hover:-translate-y-0.5"
                  >
                    <ArrowLeft size={18} className="mr-2" /> Back
                  </Button>
                  <Button
                    type="button"
                    onClick={handleStep2Next}
                    className="flex-[2] h-12 text-[15px] font-semibold rounded-xl bg-[#3742FA] hover:bg-[#2B34C8] text-white shadow-sm transition-all hover:-translate-y-0.5"
                  >
                    Next <ArrowRight size={18} className="ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Terms & Submission */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="mb-8">
                <h2 className="text-[28px] font-bold text-[#1C1B1F] mb-1.5 tracking-tight">Terms & Conditions</h2>
                <p className="text-[#7A7870] text-[15px]">
                  Please review and accept the terms to continue.
                </p>
              </div>

              <div className="space-y-6">
                <div className="p-5 bg-gray-50 border border-gray-100 rounded-2xl flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0">
                    <ShieldCheck size={20} className="text-gray-500" strokeWidth={2.5} />
                  </div>
                  <p className="text-[14px] text-[#4A4840] font-medium leading-snug">
                    Your privacy and data security are important to us.
                  </p>
                </div>

                <div className="flex items-start gap-3 pl-1">
                  <Checkbox
                    id="agreed"
                    checked={agreed}
                    onCheckedChange={(v) => setAgreed(v === true)}
                    className="mt-1 w-5 h-5 rounded-md border-gray-300 data-[state=checked]:bg-[#3742FA] data-[state=checked]:text-white"
                  />
                  <label htmlFor="agreed" className="text-[14.5px] text-[#4A4840] font-medium cursor-pointer select-none">
                    I agree to the <a href="#" className="text-[#3742FA] hover:underline">Terms of Service</a> and <a href="#" className="text-[#3742FA] hover:underline">Privacy Policy</a>
                  </label>
                </div>

                {error && (
                  <p className="text-sm text-[#FF4757] font-medium bg-[#FF4757]/8 px-3 py-2 rounded-lg">
                    {error}
                  </p>
                )}

                <div className="flex gap-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1 h-12 text-[15px] font-semibold rounded-xl border-gray-200 text-[#1C1B1F] shadow-sm hover:bg-gray-50 transition-all hover:-translate-y-0.5"
                  >
                    <ArrowLeft size={18} className="mr-2" /> Back
                  </Button>
                  <Button
                    type="button"
                    disabled={loading || !agreed}
                    onClick={handleRegisterSubmit}
                    className={`flex-[2] h-12 text-[15px] font-semibold rounded-xl shadow-sm transition-all ${!agreed ? 'bg-gray-200 text-gray-400 opacity-80' : 'bg-[#3742FA] hover:bg-[#2B34C8] text-white hover:-translate-y-0.5'}`}
                  >
                    {loading ? "Creating account…" : "Create Account"}
                    {!loading && <ArrowRight size={18} className="ml-2" />}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Success Screen */}
          {step === 4 && (
            <div className="animate-in zoom-in-95 fade-in duration-500 text-center py-6 relative">
              {/* Confetti / Sparkles decoration */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center -z-10">
                <div className="w-64 h-64 relative">
                  <div className="absolute top-4 left-8 w-2 h-2 rounded-full bg-pink-300" />
                  <div className="absolute top-12 right-12 w-3 h-3 rounded-full bg-blue-300" />
                  <div className="absolute bottom-8 left-16 w-2.5 h-2.5 rounded-full bg-yellow-300" />
                  <div className="absolute bottom-16 right-8 w-2 h-2 rounded-full bg-green-300" />
                  <div className="absolute top-1/2 left-4 w-1.5 h-1.5 rounded-full bg-purple-300" />
                  <div className="absolute top-1/4 right-4 w-2 h-2 rounded-full bg-orange-300" />
                  {/* Plus shapes */}
                  <div className="absolute top-8 left-1/2 w-3 h-3 text-green-200 rotate-45 font-bold">+</div>
                  <div className="absolute bottom-1/4 right-1/4 w-3 h-3 text-pink-200 -rotate-12 font-bold">+</div>
                </div>
              </div>

              <div className="mx-auto w-28 h-28 bg-[#E6F7ED] rounded-full flex items-center justify-center mb-8 relative">
                <Check size={56} strokeWidth={3} className="text-[#2ED573]" />
              </div>
              <h2 className="text-[28px] font-bold text-[#1C1B1F] mb-3 tracking-tight">Account Created<br/>Successfully!</h2>
              <p className="text-[#7A7870] text-[15px] mb-10 max-w-[280px] mx-auto leading-relaxed">
                Your account has been created successfully. You can now sign in to your account.
              </p>
              
              <Button
                onClick={() => navigate("/login")}
                className="w-full h-12 text-[15px] font-semibold rounded-xl bg-[#3742FA] hover:bg-[#2B34C8] text-white shadow-sm transition-all hover:-translate-y-0.5"
              >
                Continue to Sign In <ArrowRight size={18} className="ml-2" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
