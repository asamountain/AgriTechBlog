import type { ReactNode } from "react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/language-context";
import { SHOP_URL } from "@/config/site";
import "@/styles/home-geometric.css";

interface JejuShellProps {
  headerLeft: [string, string];
  headerRight: [string, string];
  children: ReactNode;
}

export default function JejuShell({ headerLeft, headerRight, children }: JejuShellProps) {
  const { lang, setLang } = useLanguage();
  const ko = lang === "ko";

  return (
    <div className="jg-page" lang={lang}>
      <div className="jg-container">
        <aside className="jg-rail">
          <div className="jg-symbols" aria-hidden="true">
            <span className="jg-circle jg-circle--tangerine" />
            <span className="jg-circle jg-circle--camellia" />
            <span className="jg-triangle" />
          </div>
          <p className="jg-rail-title">Ecological Agri.</p>
          <div className="jg-rail-spacer" aria-hidden="true" />
        </aside>

        <div className="jg-column">
          <header className="jg-header">
            <div>
              <div>{headerLeft[0]}</div>
              <div>{headerLeft[1]}</div>
            </div>
            <div className="jg-header-right">
              <div>{headerRight[0]}</div>
              <div>{headerRight[1]}</div>
            </div>
          </header>

          {children}

          <footer className="jg-footer">
            <Link href="/" className="jg-footer-logo">
              ECO AGRI-INDEX
            </Link>
            <nav className="jg-footer-links" aria-label="Site">
              <Link href="/posts">{ko ? "글" : "POSTS"}</Link>
              <Link href="/portfolio">{ko ? "포트폴리오" : "PORTFOLIO"}</Link>
              {SHOP_URL ? (
                <a href={SHOP_URL} className="jg-nav-soon" data-tip="준비 중 · COMING SOON" aria-label="FARM — 준비 중 (coming soon)">
                  {ko ? "농장" : "FARM"}
                </a>
              ) : (
                <Link href="/shop" className="jg-nav-soon" data-tip="준비 중 · COMING SOON" aria-label="FARM — 준비 중 (coming soon)">
                  {ko ? "농장" : "FARM"}
                </Link>
              )}
              <Link href="/about">{ko ? "소개" : "ABOUT"}</Link>
            </nav>
            <div className="jg-footer-meta">
              <span>[LOC] 33.4890° N, 126.4983° E</span>
              <span>© 2026 SAN</span>
              <span className="jg-lang" role="group" aria-label="Language">
                <button type="button" className={ko ? "is-active" : ""} aria-pressed={ko} onClick={() => setLang("ko")}>
                  한국어
                </button>
                <button type="button" className={ko ? "" : "is-active"} aria-pressed={!ko} onClick={() => setLang("en")}>
                  EN
                </button>
              </span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
