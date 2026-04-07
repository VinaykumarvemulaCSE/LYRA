import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "react-router-dom";

export default function FAQ() {
  return (
    <main className="pt-24 pb-16 min-h-screen">
      <div className="container max-w-4xl">
        <h1 className="font-heading text-4xl mt-8 font-extrabold mb-4 text-center">Frequently Asked Questions</h1>
        <p className="text-muted-foreground text-center mb-16">
          Find answers to our most common queries below. Still need help? <Link to="/contact" className="text-primary underline font-bold">Contact us</Link>.
        </p>

        <div className="space-y-12">
          {/* Orders & Shipping */}
          <section>
            <h2 className="font-bold text-2xl mb-6 text-primary">Orders & Shipping</h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-left font-bold font-heading text-lg">How long does shipping take?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Domestic orders typically arrive within 3-5 business days. International shipping can take anywhere from 7-14 business days depending on the destination and customs processing.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger className="text-left font-bold font-heading text-lg">Do you ship internationally?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Yes, we ship worldwide. Shipping costs and delivery times vary by country and are calculated at checkout. Please note that international customers are responsible for any duties or taxes incurred upon delivery.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger className="text-left font-bold font-heading text-lg">How can I track my order?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Once your order ships, you will receive a confirmation email with a tracking link. You can also track your order via the <Link to="/order-tracking" className="text-primary underline">Order Tracking page</Link>.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>

          {/* Returns & Exchanges */}
          <section>
            <h2 className="font-bold text-2xl mb-6 text-primary">Returns & Exchanges</h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-4">
                <AccordionTrigger className="text-left font-bold font-heading text-lg">What is your return policy?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  We accept returns within 14 days of delivery. Items must be unworn, unwashed, and have all original tags attached. Final sale items cannot be returned or exchanged. Please visit our <Link to="/refund" className="text-primary underline">Refund Policy</Link> for detailed instructions.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-5">
                <AccordionTrigger className="text-left font-bold font-heading text-lg">How do I initiate a return?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  To start a return, please log into your account, locate the order in your dashboard, and click "Initiate Return". Alternatively, contact our support team with your order number.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>

          {/* Products & sizing */}
          <section>
            <h2 className="font-bold text-2xl mb-6 text-primary">Products & Sizing</h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-6">
                <AccordionTrigger className="text-left font-bold font-heading text-lg">How do I find my size?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  You can refer to the "Size Guide" linked on every product page. If you are between sizes, we generally recommend sizing up for a more relaxed fit, but please check the specific item's description for detailed fit notes.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-7">
                <AccordionTrigger className="text-left font-bold font-heading text-lg">How should I care for my LYRA pieces?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Care instructions are specific to the material and are printed on the inner label of each garment. For delicate fabrics like silk and cashmere, we recommend dry cleaning or careful hand washing with cold water and gentle detergent.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>
        </div>
      </div>
    </main>
  );
}
