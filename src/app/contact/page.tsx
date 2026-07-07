import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function ContactPage() {
  return (
    <div className="py-24 bg-background min-h-[80vh]">
      <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-card border border-border p-8 rounded-2xl shadow-sm text-center">
            <h2 className="font-heading text-2xl font-bold mb-4">Get in Touch</h2>
            <p className="text-muted-foreground mb-6">
              Have questions about the dentsu podcast network? Reach out to our team at{" "}
              <a href="mailto:studio@ideabrews.com" className="text-dentsu font-medium hover:underline">
                studio@ideabrews.com
              </a>
            </p>
        </div>

        <div className="bg-card border border-border p-8 rounded-xl shadow-sm">
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Name</label>
                <Input id="name" placeholder="Your name" required />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <Input id="email" type="email" placeholder="your@email.com" required />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="company" className="text-sm font-medium">Company (Optional)</label>
              <Input id="company" placeholder="Your company name" />
            </div>

            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium">Message</label>
              <Textarea id="message" placeholder="How can we help you?" rows={5} required />
            </div>

            <Button type="submit" className="w-full bg-dentsu hover:bg-dentsu/90 text-white h-12">
              Send Message
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
