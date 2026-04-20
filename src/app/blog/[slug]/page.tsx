import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/JsonLd";
import { getAllArticles, getArticleBySlug } from "@/lib/data/articles";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  const articles = getAllArticles();
  if (articles.length === 0) return [{ slug: "_" }];
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.description,
  };
}

function blogPostingJsonLd(article: NonNullable<ReturnType<typeof getArticleBySlug>>) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.description,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: {
      "@type": "Organization",
      name: "Peptides Nearby",
      url: "https://peptidesnearby.com",
    },
    publisher: {
      "@type": "Organization",
      name: "Peptides Nearby",
      url: "https://peptidesnearby.com",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://peptidesnearby.com/blog/${article.slug}`,
    },
  };
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const BASE = "https://peptidesnearby.com";

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", url: BASE },
        { name: "Blog", url: `${BASE}/blog` },
        { name: article.title, url: `${BASE}/blog/${article.slug}` },
      ])} />
      <JsonLd data={blogPostingJsonLd(article)} />

      <article className="pt-12 pb-20">
        <div className="max-w-[760px] mx-auto px-6">
          <nav className="text-sm text-text-tertiary mb-6">
            <Link href="/" className="hover:text-accent">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/blog" className="hover:text-accent">Blog</Link>
            <span className="mx-2">/</span>
            <span className="text-text-secondary line-clamp-1">{article.title}</span>
          </nav>

          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded-full">
              {article.funnel}
            </span>
            <span className="text-xs text-text-tertiary">
              {article.readingTime} min read
            </span>
            <span className="text-xs text-text-tertiary">
              Updated {new Date(article.updatedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </span>
          </div>

          <h1 className="font-display text-3xl md:text-4xl text-text-primary mb-4 leading-tight">
            {article.title}
          </h1>

          <p className="text-lg text-text-secondary mb-8">
            {article.description}
          </p>

          {/* Article content */}
          <div
            className="prose prose-sm max-w-none
              prose-headings:font-display prose-headings:text-text-primary
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
              prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-text-secondary prose-p:leading-relaxed
              prose-a:text-accent prose-a:no-underline hover:prose-a:underline
              prose-strong:text-text-primary
              prose-ul:text-text-secondary prose-ol:text-text-secondary
              prose-li:text-text-secondary
              prose-table:text-sm
              prose-th:text-text-primary prose-th:bg-surface-0 prose-th:px-4 prose-th:py-2
              prose-td:px-4 prose-td:py-2 prose-td:border-b prose-td:border-border-subtle
            "
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {/* Related links */}
          {article.relatedLinks.length > 0 && (
            <div className="mt-12 pt-8 border-t border-border-subtle">
              <h2 className="font-display text-xl text-text-primary mb-4">Related</h2>
              <div className="flex flex-wrap gap-2">
                {article.relatedLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm px-4 py-2 bg-surface-0 border border-border-subtle rounded-lg text-text-secondary hover:text-accent hover:border-accent/30 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>
    </>
  );
}
