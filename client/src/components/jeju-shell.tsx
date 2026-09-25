import type { ReactNode } from "react";
import { Link } from "wouter";
import "@/styles/home-geometric.css";

interface JejuShellProps {
  headerLeft: [string, string];
  headerRight: [string, string];
  children: ReactNode;
}

export default function JejuShell({ headerLeft, headerRight, children }: JejuShellProps) {
  return (
    <div className="jg-page">
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
              <Link href="/posts">POSTS</Link>
              <Link href="/portfolio">PORTFOLIO</Link>
              <Link href="/shop">SHOP</Link>
              <Link href="/about">ABOUT</Link>
            </nav>
            <div className="jg-footer-meta">
              <span>[LOC] 33.4890° N, 126.4983° E</span>
              <span>© 2026 SAN</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
