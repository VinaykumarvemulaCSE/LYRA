import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function Blog() {
  const posts = [
    {
      id: 1,
      title: "The Art of Capsule Wardrobe",
      category: "Style Guide",
      date: "October 15, 2024",
      image: "https://images.unsplash.com/photo-1434389678249-14a0f44359db?q=80&w=2068",
      excerpt: "Discover how to curate a timeless collection of versatile pieces that make dressing effortless every day.",
    },
    {
      id: 2,
      title: "Sustainable Silk: Our Sourcing Journey",
      category: "Sustainability",
      date: "September 28, 2024",
      image: "https://images.unsplash.com/photo-1596464716127-f2a82984de30?q=80&w=2070",
      excerpt: "We traveled to the historic mills of Como, Italy to find the world's finest, most responsibly produced silk for our new collection.",
    },
    {
      id: 3,
      title: "Fall 2024 Trends: What's Worth Investing In",
      category: "Editorial",
      date: "August 10, 2024",
      image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1962",
      excerpt: "Skip the fleeting fads. Here are the enduring trends from this season that deserve a permanent spot in your closet.",
    }
  ];

  return (
    <main className="pt-24 pb-16 min-h-screen">
      <div className="container max-w-6xl">
        <h1 className="font-heading text-4xl mt-8 font-extrabold mb-4 text-center">The Journal</h1>
        <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-16">
          Stories about style, sustainability, and the people behind the clothes.
        </p>

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
      </div>
    </main>
  );
}
