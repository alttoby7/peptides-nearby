import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/JsonLd";
import { getAllArticles } from "@/lib/data/articles";

export const metadata: Metadata = {
  title: "Peptide Therapy Blog — Guides, Costs, and What to Expect",
  description: "Learn about peptide therapy: how it works, costs, side effects, injection guides, and how to find a provider near you.",
};

export default function BlogHubPage() {
  const BASE = "https://www.peptidesnearby.com";
  const articles = getAllArticles();

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", url: BASE },
        { name: "Blog", url: `${BASE}/blog` },
      ])} />

      <section className="pt-12 pb-20">
        <div className="max-w-[1240px] mx-auto px-6">
          <nav className="text-sm text-text-tertiary mb-6">
            <Link href="/" className="hover:text-accent">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-text-secondary">Blog</span>
          </nav>

          <h1 className="font-display text-3xl md:text-4xl text-text-primary mb-2">
            Peptide Therapy Blog
          </h1>
          <p className="text-text-secondary mb-8 max-w-[700px]">
            Guides to peptide therapy: what it is, how it works, costs, side effects, and how to find a provider near you.
          </p>

          {articles.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {articles.map((article) => (
                <Link
                  key={article.slug}
                  href={`/blog/${article.slug}`}
                  className="card-lift bg-white border border-border-subtle rounded-xl shadow-sm hover:border-accent/30 overflow-hidden"
                >
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                        {article.funnel}
                      </span>
                      <span className="text-[10px] text-text-tertiary">
                        {article.readingTime} min read
                      </span>
                    </div>
                    <h2 className="font-semibold text-text-primary mb-2 line-clamp-2">
                      {article.title}
                    </h2>
                    <p className="text-sm text-text-secondary line-clamp-3">
                      {article.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 bg-white border border-border-subtle rounded-xl shadow-sm text-center">
              <p className="text-text-secondary mb-4">Articles coming soon.</p>
              <Link href="/telehealth" className="inline-block px-5 py-2.5 bg-accent text-white font-semibold rounded-lg">
                Browse Telehealth Providers
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
