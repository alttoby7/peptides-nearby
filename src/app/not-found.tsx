import Link from "next/link";

export default function NotFound() {
  return (
    <section className="pt-20 pb-20 text-center">
      <div className="max-w-[640px] mx-auto px-6">
        <h1 className="font-display text-4xl text-text-primary mb-4">Page Not Found</h1>
        <p className="text-text-secondary mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-accent text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
        >
          Go Home
        </Link>
      </div>
    </section>
  );
}
