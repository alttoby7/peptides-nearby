import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { MobileMenu } from "./MobileMenu";

export function Nav() {
  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(248,250,251,0.85)",
        backdropFilter: "blur(20px) saturate(1.3)",
        WebkitBackdropFilter: "blur(20px) saturate(1.3)",
        borderBottom: "1px solid rgba(15,23,42,0.06)",
      }}
    >
      <div
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 64,
        }}
      >
        <Link href="/" aria-label="Peptides Nearby" className="inline-flex min-h-11 shrink-0 items-center">
          <Logo />
        </Link>
        <div className="flex items-center gap-1">
          <Link href="/search" aria-label="Search providers" className="flex h-11 w-11 items-center justify-center rounded-lg text-text-secondary md:hidden">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </Link>
          <MobileMenu>
            <div className="flex flex-col gap-1">
              {[
                { href: "/states", label: "Browse" },
                { href: "/map", label: "Map" },
                { href: "/clinics", label: "Clinics" },
                { href: "/pharmacies", label: "Pharmacies" },
                { href: "/telehealth", label: "Telehealth" },
              ].map((link) => (
                <Link key={link.href} href={link.href} className="flex min-h-11 items-center rounded-lg px-4 text-sm font-medium text-text-secondary hover:bg-surface-2">{link.label}</Link>
              ))}
              <Link href="/submit" className="mt-2 flex min-h-11 items-center justify-center rounded-lg bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-hover">Add Practice</Link>
            </div>
          </MobileMenu>
        <div className="hidden items-center gap-1 md:flex">
          <Link
            href="/search"
            style={{
              padding: "7px 10px",
              fontSize: 14,
              color: "#475569",
              borderRadius: 6,
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
            }}
            title="Search providers"
            aria-label="Search providers"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </Link>
          {[
            { href: "/states", label: "Browse" },
            { href: "/map", label: "Map" },
            { href: "/clinics", label: "Clinics" },
            { href: "/pharmacies", label: "Pharmacies" },
            { href: "/telehealth", label: "Telehealth" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-2 py-[7px] lg:px-[14px]"
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "#475569",
                borderRadius: 6,
                transition: "all 0.2s",
                letterSpacing: "-0.01em",
                textDecoration: "none",
              }}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/submit"
            style={{
              marginLeft: 8,
              padding: "7px 16px",
              fontSize: 14,
              fontWeight: 600,
              color: "#ffffff",
              background: "#0ea5e9",
              borderRadius: 8,
              textDecoration: "none",
              transition: "all 0.2s",
            }}
          >
            Add Practice
          </Link>
        </div>
        </div>
      </div>
    </nav>
  );
}
