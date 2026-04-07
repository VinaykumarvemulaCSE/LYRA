import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Smartphone, ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  AuthProvider,
  updateProfile,
  sendPasswordResetEmail
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { dataService } from "@/services/dataService";

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
    grecaptcha: any;
  }
}

export default function Auth() {
  const [searchParams] = useSearchParams();
  const { user, isSuccess, setIsSuccess, setWelcomeName } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");

  const [step, setStep] = useState<"identifier" | "password" | "otp">("identifier");
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inputType, setInputType] = useState<"email" | "phone" | "unknown">("unknown");

  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  // Redirect if already logged in (but only on initial mount/visit)
  useEffect(() => {
    if (user && !loading && !isSuccess && step === "identifier") {
      // Allow fallback if they manually navigated to /auth
      navigate("/account");
    }
  }, [user, navigate, isSuccess, loading, step]);

  // Cleanup reCAPTCHA on unmount
  useEffect(() => {
    return () => {
      if (recaptchaRef.current) {
        try {
          recaptchaRef.current.clear();
          recaptchaRef.current = null;
        } catch (e) {
          console.error("Cleanup error", e);
        }
      }
    };
  }, []);

  // Determine if input is email or phone
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[0-9]{10,14}$/;

    if (emailRegex.test(identifier)) {
      setInputType("email");
    } else if (phoneRegex.test(identifier)) {
      setInputType("phone");
    } else {
      setInputType("unknown");
    }
  }, [identifier]);

  const setupRecaptcha = () => {
    if (!recaptchaRef.current) {
      try {
        recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'invisible',
          'callback': () => {
            // reCAPTCHA solved
          },
          'expired-callback': () => {
            // Handle expiration
            if (recaptchaRef.current) {
              recaptchaRef.current.clear();
              recaptchaRef.current = null;
            }
          }
        });
        window.recaptchaVerifier = recaptchaRef.current;
      } catch (error) {
        console.error("Recaptcha initialization failed", error);
        toast.error("Security check failed to initialize");
      }
    }
  };

  const handleIdentifierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (inputType === "unknown") {
      toast.error("Please enter a valid email or phone number");
      return;
    }

    if (inputType === "email") {
      if (mode === "reset") {
        handlePasswordReset();
      } else {
        setStep("password");
      }
    } else if (inputType === "phone") {
      setLoading(true);
      try {
        setupRecaptcha();
        const appVerifier = window.recaptchaVerifier;
        if (!appVerifier) throw new Error("Verification system not ready");

        // Format phone to E.164 — handles +91, 0xxxxxxxxxx, and bare 10-digit
        let cleanPhone = identifier.replace(/\D/g, '');
        // Strip leading 91 (India country code) if present after removing +
        if (cleanPhone.startsWith('91') && cleanPhone.length > 10) cleanPhone = cleanPhone.slice(2);
        // Strip leading 0 (STD format)
        if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.slice(1);
        const formattedPhone = `+91${cleanPhone}`;

        console.log("Attempting to send SMS to:", formattedPhone);
        const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
        setConfirmationResult(confirmation);
        setStep("otp");
        toast.success("OTP sent to your phone");
      } catch (error: any) {
        console.error("SMS sending failed", error);
        toast.error(error.message || "Failed to send OTP");

        // Reset recaptcha
        if (window.recaptchaVerifier) {
          try {
            window.recaptchaVerifier.clear();
            recaptchaRef.current = null;
            window.recaptchaVerifier = null as any;
          } catch (e) {
            console.error("Failed to clear recaptcha", e);
          }
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePasswordReset = async () => {
    if (inputType !== "email") {
      toast.error("Please enter a valid email to reset password");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, identifier);
      toast.success("Password reset link sent to your email");
      setMode("login");
    } catch (error: any) {
      console.error("Reset password error", error);
      toast.error(error.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (step === "password") {
        if (mode === "login") {
          await signInWithEmailAndPassword(auth, identifier, password);
        } else {
          const userCredential = await createUserWithEmailAndPassword(auth, identifier, password);
          if (name) {
            await updateProfile(userCredential.user, { displayName: name });
          }
          
          // --- NEW: TRIGGER WELCOME EMAIL ---
          fetch("/api/welcome-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: identifier, firstName: name || "there" })
          }).catch(err => console.warn("Welcome email failed to dispatch:", err));
        }
      } else if (step === "otp") {
        if (!confirmationResult) throw new Error("Verification process expired. Please try again.");
        await confirmationResult.confirm(otp);
      }

      // CREATE/SYNC USER PROFILE IN FIRESTORE (best-effort, never blocks auth)
      const currentUser = auth.currentUser;
      if (currentUser) {
        dataService.users.createProfile(currentUser.uid, {
          email: currentUser.email,
          displayName: currentUser.displayName || name,
          photoURL: currentUser.photoURL,
          phoneNumber: currentUser.phoneNumber
        }).catch(err => console.warn("Profile sync failed (non-critical):", err));
      }

      const firstName = auth.currentUser?.displayName?.split(' ')[0] || "Fashionista";
      setWelcomeName(firstName);
      setIsSuccess(true);

      // Delay navigation to let the user enjoy the luxury splash
      setTimeout(() => {
        setIsSuccess(false);
        navigate("/account");
      }, 2000);
    } catch (error: any) {
      console.error("Auth error", error);
      let message = "Authentication failed. Please try again.";
      
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') 
        message = "Incorrect email or password";
      if (error.code === 'auth/user-not-found') 
        message = "No account found with this email";
      if (error.code === 'auth/email-already-in-use') 
        message = "An account already exists with this email. Try signing in instead.";
      if (error.code === 'auth/invalid-verification-code') 
        message = "Invalid OTP code. Please try again.";
      if (error.code === 'auth/too-many-requests')
        message = "Too many attempts. Please wait a moment and try again.";
      if (error.code === 'auth/weak-password')
        message = "Password must be at least 6 characters.";
      if (error.code === 'auth/network-request-failed')
        message = "Network error. Please check your connection.";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleProviderLogin = async (provider: AuthProvider) => {
    try {
      setLoading(true);
      const userCredential = await signInWithPopup(auth, provider);

      // CREATE/SYNC USER PROFILE IN FIRESTORE (best-effort, never blocks auth)
      const providerUser = userCredential.user;
      dataService.users.createProfile(providerUser.uid, {
        email: providerUser.email,
        displayName: providerUser.displayName,
        photoURL: providerUser.photoURL,
        phoneNumber: providerUser.phoneNumber
      }).catch(err => console.warn("Profile sync failed (non-critical):", err));

      const firstName = userCredential.user.displayName?.split(' ')[0] || "User";

      setWelcomeName(firstName);
      setIsSuccess(true);

      // Delay navigation to let the user enjoy the luxury splash
      setTimeout(() => {
        setIsSuccess(false);
        if (window.history.length > 2) {
           navigate(-1);
        } else {
           navigate("/account");
        }
      }, 2000);
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        console.error("Provider auth error", error);
        toast.error(error.message || "Authentication failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setStep("identifier");
    setPassword("");
    setOtp("");
  };

  return (
    <main className="pt-24 pb-24 min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background aesthetics */}
      <div className="absolute top-1/4 -left-64 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-64 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md relative z-10">
        <div className="glass-strong rounded-3xl p-8 shadow-2xl border border-white/10">

          <div className="text-center mb-8">
            <Link to="/" className="font-heading text-2xl font-bold gradient-text inline-block mb-4">LYRA</Link>
            <h1 className="font-heading text-2xl font-bold mb-2">
              {step === "identifier" && (
                mode === "reset" ? "Reset Password" : "Get Started"
              )}
              {step === "password" && (mode === "login" ? "Welcome Back" : "Create Account")}
              {step === "otp" && "Verify Phone"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {step === "identifier" && (
                mode === "reset" ? "Enter your email to receive a reset link" :
                  "Enter your email or phone number to continue"
              )}
              {step === "password" && (mode === "login" ? `Sign in to ${identifier}` : `Join LYRA with ${identifier}`)}
              {step === "otp" && `We sent a code to ${identifier}`}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {step === "identifier" ? (
              <motion.form
                key="identifier-form"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleIdentifierSubmit}
                className="space-y-4"
              >
                {mode === "signup" && (
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Full Name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-12 pl-11 pr-4 glass rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all bg-white/5"
                    />
                  </div>
                )}

                <div className="relative group">
                  {inputType === "phone" ? (
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary transition-colors" />
                  ) : (
                    <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${inputType === "email" ? "text-primary" : "text-muted-foreground"}`} />
                  )}

                  <input
                    type="text"
                    placeholder="Email or Phone Number"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full h-12 pl-11 pr-4 glass rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all bg-white/5"
                  />

                  {inputType !== "unknown" && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-4 top-1/2 -translate-y-1/2">
                      <ShieldCheck className="w-4 h-4 text-green-500" />
                    </motion.div>
                  )}
                </div>

                <div id="recaptcha-container"></div>

                <Button disabled={loading || (mode !== "reset" && inputType === "unknown") || (mode === "reset" && inputType !== "email")} type="submit" className="w-full h-12 font-bold gradient-primary border-0 rounded-xl shadow-lg hover:opacity-90 transition-opacity">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (mode === "reset" ? "Send Reset Link" : "Continue")}
                  {!loading && mode !== "reset" && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              </motion.form>
            ) : (
              <motion.form
                key="auth-step-form"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleAuthSubmit}
                className="space-y-4"
              >
                {step === "password" && (
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-12 pl-11 pr-11 glass rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all bg-white/5"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                )}

                {step === "otp" && (
                  <div className="relative">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="6-digit OTP"
                      maxLength={6}
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full h-12 pl-11 pr-4 glass rounded-xl text-sm tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all bg-white/5"
                    />
                  </div>
                )}

                <div className="flex justify-between items-center text-xs">
                  <button type="button" onClick={goBack} className="text-muted-foreground hover:text-foreground transition-colors">
                    ← Back
                  </button>
                  {step === "password" && mode === "login" && (
                    <button type="button" onClick={() => setMode("reset")} className="text-primary hover:underline font-medium">
                      Forgot Password?
                    </button>
                  )}
                </div>

                <Button disabled={loading} type="submit" className="w-full h-12 font-bold gradient-primary border-0 rounded-xl shadow-lg hover:opacity-90 transition-opacity">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (step === "otp" ? "Verify" : (mode === "login" ? "Sign In" : "Create Account"))}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>

          {step === "identifier" && mode !== "reset" && (
            <div className="mt-6">
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/20" /></div>
                <div className="relative flex justify-center text-xs"><span className="bg-[#0c1220] px-4 text-muted-foreground rounded-full border border-border/10">or continue with</span></div>
              </div>
              <div className="grid grid-cols-1">
                <button onClick={() => handleProviderLogin(googleProvider)} className="h-11 border border-white/5 bg-white/5 rounded-xl flex items-center justify-center gap-2 text-sm font-medium hover:bg-white/10 transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                  Continue with Google
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 text-center text-sm border-t border-border/20 pt-6">
            {step === "identifier" && (
              mode === "login" ? (
                <p className="text-muted-foreground">New to LYRA? <button onClick={() => setMode("signup")} className="text-primary font-bold hover:underline">Create an account</button></p>
              ) : (
                <p className="text-muted-foreground">Already have an account? <button onClick={() => setMode("login")} className="text-primary font-bold hover:underline">Sign in</button></p>
              )
            )}
            {step !== "identifier" && mode !== "reset" && (
              <p className="text-muted-foreground">
                Using the wrong account? <button onClick={goBack} className="text-primary font-bold hover:underline">Go back</button>
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </main>
  );
}
