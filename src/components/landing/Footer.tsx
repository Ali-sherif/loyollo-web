import { Link } from "@/lib/navigation";
import { Mail, MapPin, Phone } from "lucide-react";
import loyolloLogoWhite from "@/assets/loyollo-logo-white.svg";

type FooterLink = { label: string; href: string };

const columns: { title: string; links: FooterLink[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Blog", href: "#" },
      { label: "Guide", href: "/guide" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-navy-900 text-navy-100">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          <div className="sm:col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center">
              <img src={loyolloLogoWhite} alt="Loyollo" className="h-7 w-auto md:h-9" />
            </Link>
            <p className="mt-4 text-sm text-navy-200">
              Digital loyalty programs built for small businesses that want to grow.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-navy-200">
              <li className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-gold-500/15 text-gold-500">
                  <Mail className="h-4 w-4" />
                </span>
                hello@loyalty.app
              </li>
              <li className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-gold-500/15 text-gold-500">
                  <Phone className="h-4 w-4" />
                </span>
                +1 (555) 010-2040
              </li>
              <li className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-gold-500/15 text-gold-500">
                  <MapPin className="h-4 w-4" />
                </span>
                Toronto, ON
              </li>
            </ul>
          </div>

          {columns.map((c) => (
            <div key={c.title}>
              <h4 className="text-sm font-semibold text-white">{c.title}</h4>
              <ul className="mt-4 space-y-1 text-sm">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="inline-flex min-h-11 items-center py-2 text-navy-200 transition-colors hover:text-white"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-navy-200 sm:flex-row">
          <p>© {new Date().getFullYear()} Loyollo. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-white">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
