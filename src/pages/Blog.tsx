import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2, BookOpen } from "lucide-react";
import { dataService } from "@/services/dataService";
import { Button } from "@/components/ui/button";

export default function Blog() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dataService.blogs.getAll().then(data => {
      setPosts(data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  return (
    <main className="pt-24 pb-16 min-h-screen">
      <div className="container max-w-6xl">
        <h1 className="font-heading text-4xl mt-8 font-extrabold mb-4 text-center">The Journal</h1>
        <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-16">
          Stories about style, sustainability, and the people behind the clothes.
        </p>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 glass rounded-3xl border border-dashed border-border/50 max-w-2xl mx-auto">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h2 className="text-xl font-bold mb-2">New Stories Coming Soon</h2>
            <p className="text-muted-foreground">Our editors are crafting the next series of style guides and sustainable stories.</p>
            <Button asChild variant="link" className="mt-4"><Link to="/shop">Explore Shop In The Meantime</Link></Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <article key={post.id} className="group cursor-pointer">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-6 bg-muted">
                  <img 
                    src={post.image} 
                    alt={post.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  <span className="text-primary">{post.category}</span>
                  <span>•</span>
                  <span>{post.date}</span>
                </div>
                <h2 className="font-heading text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                  {post.title}
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4 line-clamp-2">
                  {post.excerpt}
                </p>
                <button 
                  onClick={() => {
                    import('sonner').then(({ toast }) => toast.info('Full blog articles coming soon.'));
                  }}
                  className="inline-flex items-center gap-2 text-sm font-bold text-foreground group-hover:text-primary transition-colors focus:outline-none"
                >
                  Read Article <ArrowRight className="w-4 h-4" />
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
