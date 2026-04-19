import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  AuthProvider,
  updateProfile,
  sendPasswordResetEmail
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { dataService } from "@/services/dataService";
import { API_ROUTES } from "@/lib/api-config";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const { user, isSuccess, setIsSuccess, setWelcomeName } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [step, setStep] = useState<"identifier" | "password">("identifier");
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && !loading && !isSuccess && step === "identifier") {
      navigate("/account");
    }
  }, [user, navigate, isSuccess, loading, step]);

  const handleIdentifierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (mode === "reset") {
      handlePasswordReset();
    } else {
      setStep("password");
    }
  };

  const handlePasswordReset = async () => {
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset link sent to your email", {
        description: "Check your inbox (and spam folder) for the link."
      });
      setMode("login");
      setStep("identifier");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (name) {
          await updateProfile(userCredential.user, { displayName: name });
        }

        fetch(API_ROUTES.WELCOME_EMAIL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email, firstName: name || "there" })
        })
          .then(res => res.json())
          .then(data => {
            if (data.previewUrl) {
              console.log("Welcome Email Preview URL:", data.previewUrl);
              toast("Dev Mode: Welcome Email Preview Link in Console");
            }
          })
          .catch(err => console.warn("Welcome email fail:", err));
      }

      const currentUser = auth.currentUser;
      if (currentUser) {
        dataService.users.createProfile(currentUser.uid, {
          email: currentUser.email,
          displayName: currentUser.displayName || name,
          photoURL: currentUser.photoURL,
        }).catch(err => console.warn("Profile sync issue:", err));
      }

      const firstName = auth.currentUser?.displayName?.split(' ')[0] || "Guest";
      setWelcomeName(firstName);
      setIsSuccess(true);

      setTimeout(() => {
        setIsSuccess(false);
        navigate("/account");
      }, 2000);
    } catch (error: any) {
      console.error("Auth error", error);
      let message = "Authentication failed. Please check your credentials.";
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') message = "Incorrect email or password";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleProviderLogin = async (provider: AuthProvider) => {
    try {
      setLoading(true);
      const userCredential = await signInWithPopup(auth, provider);

      dataService.users.createProfile(userCredential.user.uid, {
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        photoURL: userCredential.user.photoURL,
      }).catch(console.warn);

      const firstName = userCredential.user.displayName?.split(' ')[0] || "User";
      setWelcomeName(firstName);
      setIsSuccess(true);

      setTimeout(() => {
        setIsSuccess(false);
        navigate("/account");
      }, 2000);
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') toast.error("Social login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative flex items-center justify-center p-6 selection:bg-primary/20 font-body overflow-hidden">
      {/* Background Image - Clean & Static */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/assets/auth-bg-2.jpg" 
          alt="Luxury Fashion Foundation" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/10" /> {/* Subtle darkening for card separation */}
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border border-zinc-100">
          <div className="text-center mb-10">
            <Link to="/" className="font-heading text-3xl font-black tracking-tighter text-zinc-900 inline-block mb-2">
              LYRA
            </Link>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.3em]">Style Hub Premium</p>
          </div>

          <div className="mb-10">
            <h1 className="font-heading text-2xl font-bold text-zinc-900 mb-1">
              {step === "identifier" ? (mode === "reset" ? "Reset Password" : (mode === "login" ? "Sign In" : "Register")) : (mode === "login" ? "Welcome Back" : "Almost Done")}
            </h1>
            <p className="text-zinc-500 text-xs font-medium">
              {step === "identifier" ? "Please enter your details to continue" : "Please provide your password"}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {step === "identifier" ? (
              <motion.form
                key="email-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleIdentifierSubmit}
                className="space-y-5"
              >
                {mode === "signup" && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider ml-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <input
                        type="text"
                        placeholder="John Doe"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-body"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="email"
                      placeholder="name@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-12 pl-12 pr-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-body"
                    />
                  </div>
                </div>

                <Button disabled={loading} type="submit" className="w-full h-12 font-bold gradient-primary border-0 rounded-xl shadow-lg hover:opacity-90 active:scale-[0.98] transition-all text-sm text-white">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (mode === "reset" ? "Send Reset Link" : "Continue")}
                </Button>
              </motion.form>
            ) : (
              <motion.form
                key="pass-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleAuthSubmit}
                className="space-y-5"
              >
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider ml-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-12 pl-12 pr-12 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-body"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center px-1">
                  <button type="button" onClick={() => setStep("identifier")} className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest hover:text-zinc-900 transition-colors">
                    ← Back
                  </button>
                  {mode === "login" && (
                    <button type="button" onClick={() => setMode("reset")} className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">
                      Forgot Password?
                    </button>
                  )}
                </div>

                <Button disabled={loading} type="submit" className="w-full h-12 font-bold gradient-primary border-0 rounded-xl shadow-lg hover:opacity-90 active:scale-[0.98] transition-all text-sm text-white">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (mode === "login" ? "Sign In" : "Complete Registration")}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>

          {step === "identifier" && mode !== "reset" && (
            <div className="mt-8">
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-100" /></div>
                <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400"><span className="bg-white px-4">Secure Sign In</span></div>
              </div>
              
              <button 
                onClick={() => handleProviderLogin(googleProvider)} 
                className="w-full h-12 bg-white border border-zinc-200 rounded-xl flex items-center justify-center gap-3 text-sm font-bold text-zinc-600 hover:bg-zinc-50 transition-all shadow-sm active:scale-[0.98]"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                Continue with Google
              </button>
            </div>
          )}

          <div className="mt-8 text-center border-t border-zinc-100 pt-6">
            {step === "identifier" && (
              mode === "login" ? (
                <p className="text-zinc-500 text-xs font-medium">New to Lyra? <button onClick={() => setMode("signup")} className="text-primary font-bold hover:underline ml-1">Sign Up</button></p>
              ) : (
                <p className="text-zinc-500 text-xs font-medium">Already have an account? <button onClick={() => setMode("login")} className="text-primary font-bold hover:underline ml-1">Sign In</button></p>
              )
            )}
          </div>
        </div>
        
        <div className="mt-8 text-center text-[10px] font-bold text-white uppercase tracking-widest opacity-60">
           <p className="drop-shadow-sm">Secured by Lyra Platform</p>
        </div>
      </motion.div>
    </main>
  );
}
