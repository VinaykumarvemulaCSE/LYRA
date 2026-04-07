import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function About() {
  return (
    <main className="pt-24 pb-16 min-h-screen">
      {/* Hero */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden mb-16">
        <div className="absolute inset-0 bg-muted/30 -z-10" />
        <div className="container text-center max-w-3xl">
          <h1 className="font-heading text-4xl md:text-5xl font-extrabold mb-6">Redefining Minimal Luxury</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            LYRA was born out of a desire for timeless, high-quality fashion that transcends fast trends. We believe in the power of simplicity and the art of fine craftsmanship.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="container max-w-5xl mb-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="aspect-[4/5] bg-muted rounded-2xl overflow-hidden shadow-sm">
            <img 
              src="https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?q=80&w=2070" 
              alt="Our Story" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="space-y-6">
            <h2 className="font-heading text-3xl font-bold">Our Philosophy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Founded in 2024, LYRA challenges the disposable nature of modern fashion. Our garments are designed to be loved, worn, and passed down. We focus on natural materials, fair labor practices, and silhouettes that flatter.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Every seam, every button, and every stitch is a testament to our commitment to excellence. When you wear LYRA, you're wearing a piece of art that respects both the maker and the environment.
            </p>
            <div className="pt-4">
              <Link to="/shop" className="inline-flex items-center gap-2 font-bold text-primary hover:underline underline-offset-4">
                Explore The Collection <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-muted/30 py-24">
        <div className="container max-w-6xl">
          <h2 className="font-heading text-3xl font-bold text-center mb-16">Our Core Values</h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-primary border border-border">01</div>
              <h3 className="font-bold text-xl mb-4">Timeless Design</h3>
              <p className="text-muted-foreground leading-relaxed">We design outside the trend cycle, creating pieces that will be relevant today, tomorrow, and ten years from now.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-primary border border-border">02</div>
              <h3 className="font-bold text-xl mb-4">Ethical Craft</h3>
              <p className="text-muted-foreground leading-relaxed">We partner exclusively with family-owned ateliers that ensure fair wages and safe working conditions for all artisans.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-primary border border-border">03</div>
              <h3 className="font-bold text-xl mb-4">Sustainability</h3>
              <p className="text-muted-foreground leading-relaxed">From organic silk to recycled cashmere, we source materials that minimize environmental impact without compromising luxury.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
