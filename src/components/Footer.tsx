import { Laptop } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border py-10 px-4">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-heading font-bold text-lg">
          <Laptop className="h-5 w-5 text-primary" />
          <span className="text-gradient">LaptopHub</span>
        </div>
        <p className="text-sm text-muted-foreground">© 2026 LaptopHub. All rights reserved.</p>
      </div>
    </footer>
  );
}
