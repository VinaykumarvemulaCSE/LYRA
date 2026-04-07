import { useState, useEffect } from "react";
import { Star, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  content: string;
}

const mockReviews = [
  { id: '1', author: 'Eleanor V.', rating: 5, date: 'October 12, 2024', content: 'Absolutely stunning quality. The material feels incredible and the fit is perfect. Highly recommend!' },
  { id: '2', author: 'Sophia R.', rating: 4, date: 'September 28, 2024', content: 'Beautiful piece, but I needed to size down for a better fit. Customer service was excellent regarding the exchange.' },
  { id: '3', author: 'Isabella M.', rating: 5, date: 'August 15, 2024', content: 'A true staple in my wardrobe now. Will definitely be purchasing more from this collection.' },
];

export default function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [userRating, setUserRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: user?.displayName || "",
    email: user?.email || "",
    content: ""
  });

  // Sync form data if user logs in after component mounts
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || user.displayName || "",
        email: prev.email || user.email || ""
      }));
    }
  }, [user]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const q = query(collection(db, "reviews"), where("productId", "==", productId), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const fetched = snap.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            author: data.author || "Anonymous",
            rating: data.rating || 5,
            content: data.content || "",
            date: data.createdAt && data.createdAt.toMillis 
              ? new Date(data.createdAt.toMillis()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) 
              : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
          } as Review;
        });
        setReviews(fetched.length > 0 ? fetched : mockReviews); // Fallback to mock if empty for visual
      } catch (err) {
        console.error("Failed to fetch reviews", err);
        setReviews(mockReviews);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (productId) fetchReviews();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        toast.error("Please sign in", { description: "You must be signed in to leave a review." });
        return;
    }
    
    setIsSubmitting(true);
    try {
      const newReview = {
        productId,
        userId: user.uid,
        author: formData.name,
        rating: userRating,
        content: formData.content,
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, "reviews"), newReview);
      
      // Optimistic UI Update
      setReviews([{
          id: docRef.id,
          author: formData.name,
          rating: userRating,
          content: formData.content,
          date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      }, ...reviews]);
      
      toast.success("Review submitted! Thank you for your feedback.");
      setOpen(false);
      setFormData({ ...formData, content: "" });
    } catch (err) {
      toast.error("Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full mt-16 pt-12 border-t border-border">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="font-heading text-2xl font-bold">Customer Reviews</h3>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex text-primary">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < 4 ? "fill-primary" : "fill-muted text-muted"}`} />
              ))}
            </div>
            <span className="text-sm font-bold">4.8</span>
            <span className="text-sm text-muted-foreground">Based on {reviews.length} reviews</span>
          </div>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className="font-bold border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-xl"
            >
              Write a Review
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-strong border-0 sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-heading text-2xl font-bold">Share Your Experience</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Your feedback helps us and our community grow.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
              <div className="space-y-4">
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setUserRating(star)}
                      className="transition-transform active:scale-95"
                    >
                      <Star className={`w-8 h-8 ${star <= userRating ? "fill-primary text-primary" : "text-muted hover:text-primary/50"}`} />
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Name</label>
                    <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Your name" className="glass rounded-xl h-11 border-0 focus-visible:ring-primary/30" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email</label>
                    <Input required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} type="email" placeholder="Email" className="glass rounded-xl h-11 border-0 focus-visible:ring-primary/30" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Your Review</label>
                  <Textarea required value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} placeholder="Describe your experience with the product..." className="glass rounded-2xl min-h-[120px] border-0 focus-visible:ring-primary/30" />
                </div>
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full h-12 gradient-primary border-0 rounded-xl font-bold shadow-lg">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : <><Send className="w-4 h-4 ml-2 mr-2" /> Submit Review</>}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-8">
        {reviews.map((review) => (
          <div key={review.id} className="border-b border-border pb-8 last:border-0">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold">{review.author}</span>
              <span className="text-xs text-muted-foreground">{review.date}</span>
            </div>
            <div className="flex text-primary mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? "fill-primary" : "fill-muted text-muted"}`} />
              ))}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{review.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
