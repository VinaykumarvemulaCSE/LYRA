import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isSuccess: boolean;
  setIsSuccess: (val: boolean) => void;
  welcomeName: string;
  setWelcomeName: (val: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  isSuccess: false,
  setIsSuccess: () => {},
  welcomeName: "",
  setWelcomeName: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [welcomeName, setWelcomeName] = useState("");

  useEffect(() => {
    // 10-second safety timeout to prevent infinite blank screen if Firebase hangs
    const timeout = setTimeout(() => {
      setLoading(false);
      console.warn("Auth initialization timed out. Check your Firebase config or network connection.");
    }, 10000);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      clearTimeout(timeout);
      setUser(currentUser);
      setLoading(false);
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      toast.success("Signed out successfully");
    } catch (error) {
      console.error("Sign out error", error);
      toast.error("Failed to sign out");
    }
  };

  // We no longer block the entire app from rendering while Auth initializes.
  // Protected routes will handle their own loading states if needed.
  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signOut,
      isSuccess,
      setIsSuccess,
      welcomeName,
      setWelcomeName
    }}>
      {children}
    </AuthContext.Provider>
  );
};
