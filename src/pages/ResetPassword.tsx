import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Lock, Eye, EyeOff, CheckCircle2, ShieldCheck, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const oobCode = searchParams.get("oobCode");
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"verifying" | "ready" | "success" | "error">("verifying");
  const [errorMessage, setErrorMessage] = useState("");

  // Strength calculation
  const getStrength = (pass: string) => {
    let s = 0;
    if (pass.length > 8) s++;
    if (/[A-Z]/.test(pass)) s++;
    if (/[0-9]/.test(pass)) s++;
    if (/[^A-Za-z0-9]/.test(pass)) s++;
    return s;
  };
  const strength = getStrength(newPassword);

  useEffect(() => {
    if (!oobCode) {
      setStatus("error");
      setErrorMessage("No reset code found. Please ensure you clicked the link in your email correctly.");
      setVerifying(false);
      return;
    }

    // Verify the code before showing the form
    const verifyCode = async () => {
      try {
        const userEmail = await verifyPasswordResetCode(auth, oobCode);
        setEmail(userEmail);
        setStatus("ready");
      } catch (error: any) {
        console.error("Verification error", error);
        setStatus("error");
        setErrorMessage(error.message || "This link has expired or already been used.");
      } finally {
        setVerifying(false);
      }
    };

    verifyCode();
  }, [oobCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (strength < 2) {
      toast.error("Please use a stronger password");
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode!, newPassword);
      setStatus("success");
      toast.success("Password updated successfully!");
    } catch (error: any) {
      console.error("Reset error", error);
      toast.error(error.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0c1220]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground font-heading uppercase tracking-widest text-xs">Verifying Reset Link</p>
        </div>
      </div>
    );
  }

  return (
    <main className="pt-24 pb-24 min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-[#0c1220]">
      {/* Background aesthetics */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[600px] overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
        <div className="glass-strong rounded-3xl p-8 border border-white/10 shadow-2xl">
          
          <div className="text-center mb-8">
            <Link to="/" className="font-heading text-2xl font-bold gradient-text inline-block mb-6">LYRA</Link>
            
            <AnimatePresence mode="wait">
              {status === "error" ? (
                <motion.div key="error" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                  <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto text-destructive mb-4">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <h1 className="font-heading text-2xl font-bold">Unable to Reset</h1>
                  <p className="text-sm text-muted-foreground leading-relaxed">{errorMessage}</p>
                  <Button asChild className="w-full h-12 rounded-xl gradient-primary mt-4">
                    <Link to="/auth?mode=reset">Request New Link</Link>
                  </Button>
                </motion.div>
              ) : status === "success" ? (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                  <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto text-green-500 mb-6 relative">
                    <CheckCircle2 className="w-10 h-10" />
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1.5, opacity: 0 }} transition={{ repeat: Infinity, duration: 2 }} className="absolute inset-0 border-2 border-green-500 rounded-full" />
                  </div>
                  <h1 className="font-heading text-2xl font-bold">Protection Restored</h1>
                  <p className="text-sm text-muted-foreground leading-relaxed">Your password has been updated. You can now securely sign in to your LYRA account.</p>
                  <Button asChild className="w-full h-14 rounded-2xl gradient-primary font-bold shadow-lg shadow-primary/20 mt-6 group">
                    <Link to="/auth" className="flex items-center justify-center gap-2">
                      Sign In Now <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </motion.div>
              ) : (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h1 className="font-heading text-2xl font-bold mb-2">New Password</h1>
                  <p className="text-sm text-muted-foreground">Setting a strong password for <span className="text-primary font-medium">{email}</span></p>
                  
                  <form onSubmit={handleSubmit} className="space-y-5 mt-8 text-left">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="••••••••" 
                          required 
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full h-14 pl-11 pr-11 glass rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all bg-white/5 border border-white/5" 
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Strength Indicator */}
                    <div className="flex gap-1.5 px-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full bg-white/10 overflow-hidden`}>
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: strength >= i ? "100%" : "0%" }}
                            className={`h-full ${
                              strength === 1 ? "bg-red-500" :
                              strength === 2 ? "bg-orange-500" :
                              strength === 3 ? "bg-yellow-500" :
                              "bg-green-500"
                            }`} 
                          />
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Confirm Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="••••••••" 
                          required 
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full h-14 pl-11 pr-4 glass rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all bg-white/5 border border-white/5" 
                        />
                      </div>
                    </div>

                    <Button disabled={loading || !newPassword} type="submit" className="w-full h-14 font-bold gradient-primary border-0 rounded-2xl shadow-xl hover:opacity-90 transition-all mt-4 group">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <span className="flex items-center gap-2">
                          Update Password <ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </span>
                      )}
                    </Button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="text-center mt-8 text-xs text-muted-foreground">
          © 2024 LYRA Style Hub. Secured by Firebase. 
        </p>
      </motion.div>
    </main>
  );
}
