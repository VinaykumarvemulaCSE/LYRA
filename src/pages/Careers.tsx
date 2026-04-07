import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Careers() {
  const jobs = [
    { role: "Senior Frontend Engineer", dept: "Engineering", location: "Remote / Mumbai" },
    { role: "Technical Designer (Denim)", dept: "Design", location: "Mumbai, India" },
    { role: "Store Manager", dept: "Retail", location: "New York, USA" },
    { role: "Supply Chain Analyst", dept: "Operations", location: "Remote" }
  ];

  return (
    <main className="pt-32 pb-24 min-h-screen bg-background">
      <div className="container max-w-5xl">
        <div className="text-center mb-16">
          <h1 className="font-heading text-4xl md:text-5xl font-extrabold mb-6">Build the Future of Fashion</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We're a team of innovators, designers, and engineers obsessed with creating the perfect garment. Join us in shaping modern retail.
          </p>
        </div>

        <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-3xl p-8 lg:p-12 shadow-sm">
          <h2 className="font-heading text-2xl font-bold mb-8 flex items-center gap-3">
            <span className="w-2 h-8 bg-primary rounded-full"></span> Open Positions
          </h2>
          
          <div className="space-y-4">
            {jobs.map((job, idx) => (
              <div key={idx} className="group flex flex-col md:flex-row md:items-center justify-between p-6 bg-background rounded-2xl border border-border hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
                <div>
                  <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{job.role}</h3>
                  <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="bg-secondary px-3 py-1 rounded-full font-medium">{job.dept}</span>
                    <span className="flex items-center">{job.location}</span>
                  </div>
                </div>
                <div className="mt-4 md:mt-0">
                  <button 
                    onClick={() => {
                      import('sonner').then(({ toast }) => toast.success(`Application portal opened for ${job.role}`));
                    }}
                    className="inline-flex items-center gap-2 font-bold text-sm bg-primary text-primary-foreground px-6 py-3 rounded-full hover:bg-primary/90 transition-colors focus:outline-none"
                  >
                    Apply Now <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center p-8 bg-muted/40 rounded-2xl border border-border/50">
            <h3 className="font-bold mb-2">Don't see a fit?</h3>
            <p className="text-muted-foreground text-sm mb-4">We're always looking for exceptional talent. Send your resume to careers@lyrastylehub.com</p>
          </div>
        </div>
      </div>
    </main>
  );
}
