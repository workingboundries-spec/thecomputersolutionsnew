import logo from "@/assets/logo-cs.png";

export default function Footer() {
  return (
    <footer className="border-t border-primary/20 py-10 px-4 bg-card/50">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <img src={logo} alt="Computer Solutions" className="h-12 w-auto object-contain" />
        <p className="text-sm text-muted-foreground text-center">
          © 2026 <span className="text-primary font-semibold">Computer Solutions</span>. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
