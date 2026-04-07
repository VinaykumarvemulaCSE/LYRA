import { Wrench } from "lucide-react";

export default function Maintenance() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-background">
      <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
        <Wrench className="w-8 h-8 text-primary" />
      </div>
      <h1 className="font-heading text-4xl font-extrabold mb-4">We'll be right back.</h1>
      <p className="text-lg text-muted-foreground max-w-md mx-auto mb-8">
        We're currently performing some scheduled maintenance to improve your shopping experience. Please check back soon.
      </p>
      <p className="text-sm font-bold uppercase tracking-wider text-primary">
        Expected downtime: 2 hours
      </p>
    </div>
  );
}
