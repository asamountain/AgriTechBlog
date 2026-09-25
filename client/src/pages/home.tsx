import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Camera, Instagram, Mail } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { BlogPostWithDetails } from "@shared/schema";
import SEOHead from "@/components/seo-head";
import JejuShell from "@/components/jeju-shell";

const FALLBACK_PILLS = [
  "Solarpunk",
  "Ecological Agriculture",
  "Horticulture",
  "Permaculture",
  "Smart Farm",
  "Sensors",
];
const SOCIAL_LINKS = [
  { href: "https://instagram.com/like__san", label: "Instagram", Icon: Instagram },
  { href: "https://asamountain.myportfolio.com/", label: "Photo portfolio", Icon: Camera },
  { href: "mailto:sjisyours@gmail.com", label: "Email", Icon: Mail },
];
const NEW_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

function formatIssueStamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function topTags(posts: BlogPostWithDetails[], count: number): string[] {
  const freq = new Map<string, number>();
  posts.forEach((post) => post.tags?.forEach((tag) => freq.set(tag, (freq.get(tag) ?? 0) + 1)));
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([tag]) => tag);
}

export default function Home() {
  const queryClient = useQueryClient();
  const [now, setNow] = useState(() => new Date());
  const currentUrl = typeof window !== "undefined" ? window.location.origin : "";
  const keywords = [
    "agricultural technology",
    "precision agriculture",
    "IoT farming",
    "smart agriculture",
    "crop monitoring",
    "sustainable farming",
    "AgriTech innovation",
    "farm automation",
    "agricultural IoT",
    "precision farming",
    "smart farming solutions",
    "agricultural data analytics",
    "crop optimization",
    "farming technology",
    "agricultural sensors",
  ];

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const { data: posts, isLoading } = useQuery<BlogPostWithDetails[]>({
    queryKey: ["/api/blog-posts", { limit: 8, offset: 0, includeDrafts: false, postType: "blog" }],
    retry: 1,
  });

  const prefetchPost = useCallback(
    (slug: string) => {
      queryClient.prefetchQuery({
        queryKey: [`/api/blog-post`, { slug }],
        queryFn: async () => {
          const response = await fetch(`/api/blog-post?slug=${slug}`);
          if (!response.ok) throw new Error("Failed to prefetch post");
          return response.json();
        },
        staleTime: 5 * 60 * 1000,
      });
    },
    [queryClient],
  );

  const entries = posts?.slice(0, 8) ?? [];

  const pills = useMemo(() => {
    const tags = topTags(entries, 6).map((tag) => ({ label: tag, href: `/tags/${encodeURIComponent(tag)}` }));
    const filler = FALLBACK_PILLS.slice(tags.length).map((label) => ({ label, href: "/posts" }));
    return [...tags, ...filler];
  }, [entries]);

  return (
    <>
      <SEOHead
        title="San's Agricultural Technology Blog - Innovation & Sustainable Farming"
        description="Discover cutting-edge agricultural technology, IoT solutions, and sustainable farming practices."
        keywords={keywords}
        image="/api/og-image?title=AgriTech Innovation Hub&category=Agricultural Technology&author=San&excerpt=Cutting-edge agricultural technology and sustainable farming solutions"
        url={currentUrl}
        type="website"
        author="San"
      />
      <JejuShell
        headerLeft={["[SYSTEM] SOLARPUNK.AGRI.V1", "[FOCUS] ECOLOGICAL // HORTICULTURE"]}
        headerRight={["AN OPEN QUESTION", formatIssueStamp(now)]}
      >
        <div className="jg-body">
          <main className="jg-main">
            <p className="jg-meta">[VISION] 사람과 모든 생명까지, 그리고 농부도?</p>
            <h1 className="jg-title">
              <span>Can a farm</span>
              <span>feed people</span>
              <span>&amp; all life?</span>
            </h1>
            <p className="jg-lede">
              Can a farm feed people and every living thing — natural enemies and the wider ecosystem included — and
              still feed the farmer? I&apos;m finding out. Field notes on solarpunk farming, sustainable ecological
              agriculture and horticulture, with the code and sensors that help nature and machine make abundance
              together.
            </p>

            <div className="jg-social">
              <span className="jg-social-label">[FOLLOW MY JOURNEY]</span>
              {SOCIAL_LINKS.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  className="jg-social-link"
                  aria-label={label}
                  title={label}
                  {...(href.startsWith("mailto:") ? {} : { target: "_blank", rel: "noopener noreferrer" })}
                >
                  <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                </a>
              ))}
            </div>

            <nav className="jg-pills" aria-label="Topics">
              {pills.map((pill) => (
                <Link key={pill.label} href={pill.href} className="jg-pill">
                  {pill.label}
                </Link>
              ))}
            </nav>

            <div className="jg-index">
              <div className="jg-index-head">
                <span>Code</span>
                <span>Article Title</span>
                <span>Status</span>
              </div>

              {isLoading &&
                [1, 2, 3, 4].map((i) => (
                  <div className="jg-row" key={i} aria-hidden="true">
                    <span className="jg-skeleton jg-skeleton--code" />
                    <span className="jg-skeleton" style={{ width: `${60 + i * 8}%` }} />
                    <span className="jg-skeleton jg-skeleton--status jg-row-status" />
                  </div>
                ))}

              {!isLoading && entries.length === 0 && <div className="jg-row-empty">NO ENTRIES FOUND</div>}

              {entries.map((post, index) => {
                const created = new Date(post.createdAt);
                const year = isNaN(created.getTime()) ? now.getFullYear() : created.getFullYear();
                const isNew = !isNaN(created.getTime()) && now.getTime() - created.getTime() <= NEW_WINDOW_MS;
                return (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="jg-row"
                    onMouseEnter={() => prefetchPost(post.slug)}
                  >
                    <span className="jg-row-code">{`AT-${year}-${String(index + 1).padStart(3, "0")}`}</span>
                    <span className="jg-row-title">{post.title}</span>
                    <span className="jg-row-status">
                      <span className={`jg-status${isNew ? " jg-status--new" : ""}`}>{isNew ? "New" : "Read"}</span>
                    </span>
                  </Link>
                );
              })}

              <Link href="/posts" className="jg-more">
                View all entries →
              </Link>
            </div>
          </main>

          <section className="jg-image" aria-hidden="true">
            <span className="jg-node">NODE_V.09 // AS-44</span>
          </section>
        </div>
      </JejuShell>
    </>
  );
}
