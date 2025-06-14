import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const subscribeNewsletter = useMutation({
    mutationFn: async (email: string) => {
      return apiRequest("POST", "/api/newsletter/subscribe", { email });
    },
    onSuccess: () => {
      toast({
        title: "Successfully subscribed!",
        description: "Thank you for subscribing to our newsletter.",
      });
      setEmail("");
    },
    onError: () => {
      toast({
        title: "Subscription failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && email.includes("@")) {
      subscribeNewsletter.mutate(email);
    } else {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
    }
  };

  return (
    <section className="py-16 bg-gradient-to-br from-forest-green to-sage-green">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="text-white">
          <h2 className="text-4xl font-playfair font-bold mb-4">
            Stay Connected with AgroTech
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Get the latest insights on agricultural innovation, sustainability practices, 
            and technology breakthroughs delivered to your inbox.
          </p>
          
          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-6 py-3 rounded-lg text-gray-900 placeholder-gray-500 bg-white border-0 focus:ring-4 focus:ring-white/30"
                required
              />
              <Button 
                type="submit"
                disabled={subscribeNewsletter.isPending}
                className="bg-golden-yellow hover:bg-yellow-500 text-forest-green font-semibold px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                {subscribeNewsletter.isPending ? "Subscribing..." : "Subscribe"}
              </Button>
            </div>
            <p className="text-green-100 text-sm mt-4">
              Join 15,000+ agricultural professionals. Unsubscribe anytime.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
