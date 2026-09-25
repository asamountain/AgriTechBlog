import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Camera, Instagram, Mail } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { BlogPostWithDetails } from "@shared/schema";
import SEOHead from "@/components/seo-head";
import JejuShell from "@/components/jeju-shell";
import { useLanguage } from "@/contexts/language-context";

const FALLBACK_PILLS = {
  en: ["Solarpunk", "Ecological Agriculture", "Horticulture", "Permaculture", "Smart Farm", "Sensors"],
  ko: ["솔라펑크", "생태농업", "원예", "퍼머컬처", "스마트팜", "센서"],
};
const SOCIAL_LINKS = [
  { href: "https://instagram.com/like__san", label: { en: "Instagram", ko: "인스타그램" }, Icon: Instagram },
  { href: "https://asamountain.myportfolio.com/", label: { en: "Photo portfolio", ko: "사진 포트폴리오" }, Icon: Camera },
  { href: "mailto:sjisyours@gmail.com", label: { en: "Email", ko: "이메일" }, Icon: Mail },
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
  const { lang } = useLanguage();
  const ko = lang === "ko";
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
    const filler = FALLBACK_PILLS[lang].slice(tags.length).map((label) => ({ label, href: "/posts" }));
    return [...tags, ...filler];
  }, [entries, lang]);

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
        headerRight={[ko ? "열린 질문" : "AN OPEN QUESTION", formatIssueStamp(now)]}
      >
        <div className="jg-body">
          <main className="jg-main">
            <p className="jg-meta">[VISION] 사람과 모든 생명까지, 그리고 농부도?</p>
            <h1 className="jg-title">
              {ko ? (
                <>
                  <span>농장은 사람과</span>
                  <span>모든 생명을</span>
                  <span>먹일 수 있을까?</span>
                </>
              ) : (
                <>
                  <span>Can a farm</span>
                  <span>feed people</span>
                  <span>&amp; all life?</span>
                </>
              )}
            </h1>
            <p className="jg-lede">
              {ko
                ? "천적과 생태계까지 포함해서 사람과 모든 생명을 먹이면서, 농부도 먹고살 수 있을까요? 지금 직접 알아보는 중입니다. 솔라펑크 농업, 지속가능한 생태농업, 원예 이야기와 함께, 자연과 기계가 풍요를 함께 만들도록 돕는 코드와 센서 이야기를 기록합니다."
                : "Can a farm feed people and every living thing — natural enemies and the wider ecosystem included — and still feed the farmer? I'm finding out. Field notes on solarpunk farming, sustainable ecological agriculture and horticulture, with the code and sensors that help nature and machine make abundance together."}
            </p>

            <div className="jg-social">
              <span className="jg-social-label">{ko ? "[FOLLOW] 여정 따라가기" : "[FOLLOW MY JOURNEY]"}</span>
              {SOCIAL_LINKS.map(({ href, label, Icon }) => (
                <a
                  key={label.en}
                  href={href}
                  className="jg-social-link"
                  aria-label={label[lang]}
                  title={label[lang]}
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
                <span>{ko ? "코드" : "Code"}</span>
                <span>{ko ? "글 제목" : "Article Title"}</span>
                <span>{ko ? "상태" : "Status"}</span>
              </div>

              {isLoading &&
                [1, 2, 3, 4].map((i) => (
                  <div className="jg-row" key={i} aria-hidden="true">
                    <span className="jg-skeleton jg-skeleton--code" />
                    <span className="jg-skeleton" style={{ width: `${60 + i * 8}%` }} />
                    <span className="jg-skeleton jg-skeleton--status jg-row-status" />
                  </div>
                ))}

              {!isLoading && entries.length === 0 && <div className="jg-row-empty">{ko ? "아직 글이 없습니다" : "NO ENTRIES FOUND"}</div>}

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
                      <span className={`jg-status${isNew ? " jg-status--new" : ""}`}>{isNew ? (ko ? "새 글" : "New") : ko ? "읽기" : "Read"}</span>
                    </span>
                  </Link>
                );
              })}

              <Link href="/posts" className="jg-more">
                {ko ? "모든 글 보기 →" : "View all entries →"}
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
