import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { BlogPostWithDetails } from "@shared/schema";
import JejuShell from "@/components/jeju-shell";
import { stripMarkdown } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80";

function ProjectCard({ project, lang, index }: { project: BlogPostWithDetails; lang: "ko" | "en"; index: number }) {
  const excerptText = stripMarkdown(project.excerpt || "");

  return (
    <Link href={`/blog/${project.slug}`} className="jg-card">
      <div className="jg-card-media">
        <img src={project.featuredImage || FALLBACK_IMAGE} alt={project.title} loading="lazy" />
        <span className="jg-card-code">{`PJ-${String(index + 1).padStart(2, "0")}`}</span>
        {project.impact && <span className="jg-card-impact">{project.impact}</span>}
      </div>

      <div className="jg-card-body">
        <p className="jg-card-cat">{`[CATEGORY] ${project.tags?.[0] || "AgriTech"}`}</p>
        <h2 className="jg-card-title">{project.title}</h2>
        {excerptText && <p className="jg-card-excerpt">{excerptText}</p>}

        {project.tags && project.tags.length > 0 && (
          <div className="jg-card-tags">
            {project.tags.slice(0, 5).map((tag) => (
              <span key={tag} className="jg-tag">
                {tag}
              </span>
            ))}
          </div>
        )}

        <span className="jg-card-cta">{lang === "ko" ? "사례 보기" : "View case study"} →</span>
      </div>
    </Link>
  );
}

function CardPlaceholder({ delay }: { delay: number }) {
  return (
    <div className="jg-card jg-card--loading" aria-hidden="true">
      <div className="jg-card-media jg-hero--loading" />
      <div className="jg-card-body">
        <span className="jg-skeleton jg-skeleton--block" style={{ width: "40%", height: 12, animationDelay: `${delay}ms` }} />
        <span className="jg-skeleton jg-skeleton--block" style={{ width: "85%", height: 24, animationDelay: `${delay}ms` }} />
        <span className="jg-skeleton jg-skeleton--block" style={{ width: "100%", height: 14, animationDelay: `${delay}ms` }} />
        <span className="jg-skeleton jg-skeleton--block" style={{ width: "70%", height: 14, animationDelay: `${delay}ms` }} />
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  const { lang } = useLanguage();
  const { data: projects, isLoading } = useQuery<BlogPostWithDetails[]>({
    queryKey: ["/api/blog-posts", { postType: "portfolio", includeDrafts: false }],
  });

  const count = projects?.length ?? 0;

  return (
    <JejuShell
      headerLeft={["[SYSTEM] PORTFOLIO.V1", "[FOCUS] ECOLOGICAL AGRICULTURE"]}
      headerRight={[lang === "ko" ? "주요 작업" : "SELECTED WORK", isLoading ? (lang === "ko" ? "불러오는 중..." : "LOADING...") : lang === "ko" ? `${count}개의 프로젝트` : `${count} ${count === 1 ? "PROJECT" : "PROJECTS"}`]}
    >
      <div className="jg-body">
        <main className="jg-main">
          <div className="jg-post jg-post--wide">
            <p className="jg-meta">{lang === "ko" ? "[SELECTED WORK] 주요 작업" : "[SELECTED WORK]"}</p>
            <h1 className="jg-post-title jg-post-title--md">{lang === "ko" ? "애그리테크 포트폴리오." : "AgriTech Portfolio."}</h1>
            <p className="jg-post-lede">
              {lang === "ko" ? "사례 연구 및 기술 구현." : "Case studies and technical implementations."}
            </p>

            {isLoading ? (
              <div className="jg-cards" aria-busy="true">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <CardPlaceholder key={i} delay={i * 90} />
                ))}
              </div>
            ) : projects && projects.length > 0 ? (
              <div className="jg-cards">
                {projects.map((project, i) => (
                  <ProjectCard key={project.id} project={project} lang={lang} index={i} />
                ))}
              </div>
            ) : (
              <div className="jg-index">
                <div className="jg-row-empty">
                  {lang === "ko" ? "아직 프로젝트가 없습니다. 곧 다시 확인해 주세요!" : "NO PROJECTS ADDED YET. CHECK BACK SOON."}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </JejuShell>
  );
}
