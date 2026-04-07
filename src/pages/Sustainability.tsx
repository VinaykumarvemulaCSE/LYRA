export default function Sustainability() {
  return (
    <main className="pt-32 pb-24 min-h-screen bg-background text-foreground">
      <div className="container max-w-4xl">
        <div className="text-center mb-16">
          <h1 className="font-heading text-4xl md:text-5xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">Our Commitment to Earth</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Fashion shouldn't cost the earth. We are redesigning the lifecycle of our clothes to protect our oceans and forests.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-secondary/40 backdrop-blur-md border border-border/50 p-8 rounded-2xl shadow-sm">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xl mb-6">1</div>
            <h3 className="font-heading text-2xl font-bold mb-4">100% Organic Fabrics</h3>
            <p className="text-muted-foreground leading-relaxed">
              By 2026, every single piece of LYRA clothing will be made from entirely organic, recycled, or regenerative sources. We've eliminated synthetic dyes from our denim lines completely.
            </p>
          </div>
          <div className="bg-secondary/40 backdrop-blur-md border border-border/50 p-8 rounded-2xl shadow-sm">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xl mb-6">2</div>
            <h3 className="font-heading text-2xl font-bold mb-4">Zero Waste Packaging</h3>
            <p className="text-muted-foreground leading-relaxed">
              We ditched plastic polybags. Your orders arrive in fully compostable mailers made from cornstarch, and our hangtags are planted with wildflower seeds.
            </p>
          </div>
        </div>

        <div className="w-full aspect-[21/9] bg-muted rounded-3xl overflow-hidden relative group">
          <img src="https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=2070" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt="Nature" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 md:p-12">
            <h2 className="text-white font-heading text-3xl font-bold mb-2">Our 2030 Pledge</h2>
            <p className="text-white/80 max-w-lg">We are committed to achieving net-zero carbon emissions across our entire supply chain by the year 2030.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
