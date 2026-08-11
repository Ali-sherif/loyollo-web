import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Link, useRouterState } from "@/lib/navigation";
import * as React from "react";
import loyolloLogo from "@/assets/loyollo-logo.svg";

const links = [
  { label: "Features", to: "/features" as const, type: "route" as const },
  { label: "Pricing", to: "/pricing" as const, type: "route" as const },
  { label: "About", to: "/about" as const, type: "route" as const },
  { label: "Contact", to: "/contact" as const, type: "route" as const },
];

export function Navbar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = React.useState(false);

  const handleNavClick = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-md md:hidden"
                aria-label={open ? "Close menu" : "Open menu"}
                aria-expanded={open}
                aria-controls="mobile-nav-sheet"
              >
                <Menu className="h-6 w-6" />
              </button>
            </SheetTrigger>
            <SheetContent
              id="mobile-nav-sheet"
              side="left"
              className="flex w-[280px] flex-col gap-6"
            >
              <SheetTitle className="sr-only">Navigation menu</SheetTitle>

              <Link to="/" className="flex items-center" onClick={handleNavClick}>
                <img src={loyolloLogo} alt="Loyollo" className="h-7 w-auto" />
              </Link>

              <nav className="flex flex-col gap-4">
                {links.map((l) => {
                  const isActive = pathname === l.to;
                  const baseCls = "text-base font-medium transition-colors";
                  const cls = isActive
                    ? `${baseCls} text-navy-900 font-semibold`
                    : `${baseCls} text-navy-700 hover:text-navy-900`;
                  return (
                    <Link key={l.label} to={l.to} className={cls} onClick={handleNavClick}>
                      {l.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-auto flex flex-col gap-3">
                <Link
                  to="/signin"
                  className="inline-flex items-center justify-center text-sm font-semibold text-navy-800 hover:text-navy-900"
                  onClick={handleNavClick}
                >
                  Sign in
                </Link>
                <Button variant="gold" size="lg" onClick={handleNavClick} asChild>
                  <Link to="/signup">Get Started</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <nav className="hidden items-center gap-8 md:flex">
            {links.map((l) => {
              const isActive = pathname === l.to;
              const baseCls = "text-sm font-medium transition-colors";
              const cls = isActive
                ? `${baseCls} text-navy-900 font-semibold`
                : `${baseCls} text-navy-700 hover:text-navy-900`;
              return (
                <Link key={l.label} to={l.to} className={cls}>
                  {l.label}
                  {isActive && (
                    <span className="mx-auto mt-1 block h-0.5 w-6 rounded-full bg-gold-500" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <Link to="/" className="flex items-center">
          <img src={loyolloLogo} alt="Loyollo" className="h-7 w-auto md:h-9" />
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/signin"
            className="hidden text-sm font-semibold text-navy-800 hover:text-navy-900 sm:inline-flex"
          >
            Sign in
          </Link>
          <Button variant="gold" size="lg" asChild>
            <Link to="/signup">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
