import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export function Footer() {
  return (
    <footer className="border-t border-border-subtle mt-16 pt-16 pb-8 bg-white">
      <div className="max-w-[1240px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-12 mb-12">
          <div>
            <Link href="/" aria-label="Peptides Nearby" className="inline-flex min-h-11 items-center mb-1">
              <Logo />
            </Link>
            <p className="text-[13.5px] text-text-tertiary max-w-[280px] mt-2 leading-relaxed">
              Find peptide therapy clinics, compounding pharmacies, and wellness centers in your city.
            </p>
          </div>
          <div>
            <h3 className="text-xs md:text-[11.5px] font-semibold uppercase tracking-widest text-text-tertiary mb-4">Browse</h3>
            <ul className="flex flex-col gap-2">
              <li><Link href="/states" className="text-[13.5px] text-text-secondary hover:text-accent transition-colors">All States</Link></li>
              <li><Link href="/clinics" className="text-[13.5px] text-text-secondary hover:text-accent transition-colors">Clinics</Link></li>
              <li><Link href="/pharmacies" className="text-[13.5px] text-text-secondary hover:text-accent transition-colors">Pharmacies</Link></li>
              <li><Link href="/wellness-centers" className="text-[13.5px] text-text-secondary hover:text-accent transition-colors">Wellness Centers</Link></li>
              <li><Link href="/telehealth" className="text-[13.5px] text-text-secondary hover:text-accent transition-colors">Telehealth</Link></li>
              <li><Link href="/compare" className="text-[13.5px] text-text-secondary hover:text-accent transition-colors">Compare</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs md:text-[11.5px] font-semibold uppercase tracking-widest text-text-tertiary mb-4">Treatments</h3>
            <ul className="flex flex-col gap-2">
              {["BPC-157", "Semaglutide", "Tirzepatide", "GHK-Cu", "Sermorelin", "CJC-1295 / Ipamorelin"].map((name) => (
                <li key={name}>
                  <Link
                    href={`/peptides/${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                    className="text-[13.5px] text-text-secondary hover:text-accent transition-colors"
                  >
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs md:text-[11.5px] font-semibold uppercase tracking-widest text-text-tertiary mb-4">Resources</h3>
            <ul className="flex flex-col gap-2">
              <li><Link href="/search" className="text-[13.5px] text-text-secondary hover:text-accent transition-colors">Search</Link></li>
              <li><Link href="/submit" className="text-[13.5px] text-text-secondary hover:text-accent transition-colors">Add Your Practice</Link></li>
              <li><Link href="/about" className="text-[13.5px] text-text-secondary hover:text-accent transition-colors">About</Link></li>
              <li><Link href="/privacy" className="text-[13.5px] text-text-secondary hover:text-accent transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-[13.5px] text-text-secondary hover:text-accent transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pt-8 border-t border-border-subtle gap-4">
          <span className="text-[12.5px] text-text-tertiary">&copy; 2026 Peptides Nearby. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
