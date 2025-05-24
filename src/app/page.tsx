import CrypticMessengerForm from "@/components/cryptic-messenger-form";
import { Toaster } from "@/components/ui/toaster";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-background">
      <CrypticMessengerForm />
      <Toaster />
    </main>
  );
}
