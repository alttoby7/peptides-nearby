"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function MobileMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    }
    function onPointerDown(event: PointerEvent) {
      if (!menu.current?.contains(event.target as Node)) setOpen(false);
    }
    const desktop = window.matchMedia("(min-width: 768px)");
    function onResize() { if (desktop.matches) setOpen(false); }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    desktop.addEventListener("change", onResize);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      desktop.removeEventListener("change", onResize);
    };
  }, [open]);

  return (
    <div ref={menu} className="md:hidden" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false);
    }}>
      <button ref={button} type="button" aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open} aria-controls="mobile-navigation"
        onClick={() => setOpen(!open)} className="flex h-11 w-11 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-2">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" d={open ? "M6 6l12 12M6 18L18 6" : "M4 6h16M4 12h16M4 18h16"} />
        </svg>
      </button>
      <div id="mobile-navigation" hidden={!open}
        className="absolute inset-x-0 top-full max-h-[calc(100dvh-64px)] overflow-y-auto border-b border-border-medium bg-white p-4 shadow-lg"
        onClick={(event) => { if ((event.target as HTMLElement).closest("a")) setOpen(false); }}>
        {children}
      </div>
    </div>
  );
}
