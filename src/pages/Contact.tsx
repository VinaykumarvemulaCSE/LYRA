import { Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Contact() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Message sent successfully!", {
      description: "We will get back to you within 24 hours.",
    });
  };

  return (
    <main className="pt-24 pb-16 min-h-screen">
      <div className="container max-w-6xl">
        <h1 className="font-heading text-4xl mt-8 font-extrabold mb-4 text-center">Contact Us</h1>
        <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-16">
          Whether you have a question about an order, styling advice, or just want to say hello, we'd love to hear from you.
        </p>

        <div className="grid md:grid-cols-5 gap-12">
          {/* Info */}
          <div className="md:col-span-2 space-y-8">
            <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
              <h2 className="font-bold text-xl mb-6">Get in Touch</h2>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm uppercase tracking-wider mb-1">Email</h3>
                    <p className="text-muted-foreground">hello@lyrastylehub.com</p>
                    <p className="text-xs text-muted-foreground mt-1">We aim to reply within 24 hours.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm uppercase tracking-wider mb-1">Phone</h3>
                    <p className="text-muted-foreground">+91 98765 43210</p>
                    <p className="text-xs text-muted-foreground mt-1">Mon-Fri, 9am - 6pm IST</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm uppercase tracking-wider mb-1">Studio</h3>
                    <p className="text-muted-foreground">
                      123 Luxury Lane<br />
                      Bandra West<br />
                      Mumbai, 400050<br />
                      India
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="md:col-span-3">
            <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-8 shadow-sm space-y-6">
              <h2 className="font-bold text-xl mb-6">Send a Message</h2>
              
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">First Name</label>
                  <input required type="text" className="w-full h-12 px-4 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary focus:outline-none" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Last Name</label>
                  <input required type="text" className="w-full h-12 px-4 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Email Address</label>
                <input required type="email" className="w-full h-12 px-4 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary focus:outline-none" />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Subject</label>
                <select className="w-full h-12 px-4 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary focus:outline-none">
                  <option>Order Inquiry</option>
                  <option>Returns & Exchanges</option>
                  <option>Product Information</option>
                  <option>Press & Media</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Message</label>
                <textarea required rows={5} className="w-full p-4 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary focus:outline-none resize-none"></textarea>
              </div>

              <Button type="submit" className="w-full h-12 font-bold text-base">Send Message</Button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
