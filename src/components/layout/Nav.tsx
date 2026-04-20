import Link from "next/link";

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
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 700,
            fontSize: 17,
            letterSpacing: "-0.02em",
            color: "#0f172a",
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              background: "linear-gradient(135deg, #0ea5e9, #059669)",
              borderRadius: 7,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 800,
              color: "#ffffff",
            }}
          >
            PN
          </div>
          Peptides Nearby
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
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
              style={{
                padding: "7px 14px",
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
    </nav>
  );
}
