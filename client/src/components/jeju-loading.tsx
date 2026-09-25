import JejuShell from "@/components/jeju-shell";

type Variant = "post" | "list" | "cards" | "page";

interface JejuPageSkeletonProps {
  variant?: Variant;
  label?: string;
}

function Bar({ w = "100%", h = 16, delay = 0 }: { w?: string; h?: number; delay?: number }) {
  return <span className="jg-skeleton jg-skeleton--block" style={{ width: w, height: h, animationDelay: `${delay}ms` }} />;
}

function PostPlaceholder() {
  return (
    <>
      <div className="jg-hero jg-hero--loading" />
      <Bar w="120px" h={14} />
      <div className="jg-skeleton-stack jg-skeleton-title">
        <Bar w="92%" h={56} />
        <Bar w="70%" h={56} delay={120} />
      </div>
      <div className="jg-skeleton-stack">
        <Bar w="80%" h={20} />
        <Bar w="55%" h={20} delay={120} />
      </div>
      <div className="jg-actions">
        <span className="jg-skeleton jg-skeleton--btn" />
        <span className="jg-skeleton jg-skeleton--btn" />
      </div>
      <section className="jg-box" aria-hidden="true">
        <div className="jg-box-head">
          <span className="jg-box-dot" />
          [T.O.D.] Table of Details
        </div>
        <div className="jg-box-grid">
          {[0, 1, 2, 3].map((i) => (
            <div className="jg-box-cell" key={i}>
              <Bar w="60px" h={10} delay={i * 80} />
              <Bar w="120px" h={16} delay={i * 80} />
            </div>
          ))}
        </div>
      </section>
      <div className="jg-skeleton-stack">
        {[100, 96, 88, 100, 72].map((w, i) => (
          <Bar key={i} w={`${w}%`} h={14} delay={i * 90} />
        ))}
      </div>
    </>
  );
}

function ListPlaceholder() {
  return (
    <>
      <div className="jg-skeleton-stack jg-skeleton-title">
        <Bar w="70%" h={72} />
        <Bar w="45%" h={72} delay={120} />
      </div>
      <div className="jg-skeleton-stack">
        <Bar w="60%" h={20} />
      </div>
      <div className="jg-index" aria-hidden="true">
        <div className="jg-index-head">
          <span>Code</span>
          <span>Article Title</span>
          <span>Status</span>
        </div>
        {[0, 1, 2, 3, 4].map((i) => (
          <div className="jg-row" key={i}>
            <span className="jg-skeleton jg-skeleton--code" style={{ animationDelay: `${i * 90}ms` }} />
            <span className="jg-skeleton" style={{ width: `${55 + ((i * 13) % 35)}%`, animationDelay: `${i * 90}ms` }} />
            <span className="jg-skeleton jg-skeleton--status jg-row-status" style={{ animationDelay: `${i * 90}ms` }} />
          </div>
        ))}
      </div>
    </>
  );
}

function CardsPlaceholder() {
  return (
    <>
      <div className="jg-skeleton-stack jg-skeleton-title">
        <Bar w="75%" h={56} />
        <Bar w="45%" h={56} delay={120} />
      </div>
      <div className="jg-skeleton-stack">
        <Bar w="50%" h={20} />
      </div>
      <div className="jg-cards" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div className="jg-card jg-card--loading" key={i}>
            <div className="jg-card-media jg-hero--loading" />
            <div className="jg-card-body">
              <Bar w="40%" h={12} delay={i * 90} />
              <Bar w="85%" h={24} delay={i * 90} />
              <Bar w="100%" h={14} delay={i * 90} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function PagePlaceholder() {
  return (
    <>
      <div className="jg-skeleton-stack jg-skeleton-title">
        <Bar w="80%" h={64} />
        <Bar w="50%" h={64} delay={120} />
      </div>
      <div className="jg-skeleton-stack">
        {[100, 92, 96, 64].map((w, i) => (
          <Bar key={i} w={`${w}%`} h={16} delay={i * 90} />
        ))}
      </div>
    </>
  );
}

export default function JejuPageSkeleton({ variant = "page", label = "Loading" }: JejuPageSkeletonProps) {
  return (
    <JejuShell
      headerLeft={["[SYSTEM] ECO.AGRI.V1", "[FOCUS] ECOLOGICAL AGRICULTURE"]}
      headerRight={["STATUS", "LOADING..."]}
    >
      <div className="jg-body">
        <main className="jg-main" aria-busy="true">
          <div className={`jg-post${variant === "cards" ? " jg-post--wide" : ""}`}>
            <p className="jg-loading-label" role="status">
              {`[${label.toUpperCase()}]`}
              <span className="jg-cursor" aria-hidden="true">
                _
              </span>
            </p>
            {variant === "post" && <PostPlaceholder />}
            {variant === "list" && <ListPlaceholder />}
            {variant === "cards" && <CardsPlaceholder />}
            {variant === "page" && <PagePlaceholder />}
          </div>
        </main>
      </div>
    </JejuShell>
  );
}
