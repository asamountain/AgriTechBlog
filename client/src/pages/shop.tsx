import { useState } from "react";
import JejuShell from "@/components/jeju-shell";
import SEOHead from "@/components/seo-head";
import { useLanguage } from "@/contexts/language-context";
import { CROPS, CROP_STATUS_LABEL, type Crop } from "@/data/crops";

const CONTACT_EMAIL = "sjisyours@gmail.com";
const INSTAGRAM_URL = "https://instagram.com/like__san";
const GLYPHS = ["circle-tangerine", "circle-camellia", "triangle"] as const;

function mailto(subject: string, body: string): string {
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function CropRow({
  crop,
  index,
  lang,
  selected,
  onToggle,
}: {
  crop: Crop;
  index: number;
  lang: "ko" | "en";
  selected: boolean;
  onToggle: () => void;
}) {
  const ref = `CR-${String(index + 1).padStart(2, "0")}`;
  const cells: { label: string; value: string }[] = [
    { label: lang === "ko" ? "종류" : "Kind", value: crop.kind[lang] },
    { label: lang === "ko" ? "상태" : "Status", value: CROP_STATUS_LABEL[crop.status][lang] },
    {
      label: lang === "ko" ? "수확 시기" : "Harvest",
      value: crop.season ? crop.season[lang] : lang === "ko" ? "미정" : "TBA",
    },
    { label: lang === "ko" ? "발송지" : "Ships from", value: lang === "ko" ? "제주" : "Jeju" },
  ];

  return (
    <article className="jg-crop-row">
      <div className="jg-shop-media jg-crop-media">
        {crop.image ? (
          <img src={crop.image} alt={crop.name[lang]} loading="lazy" />
        ) : (
          <span className={`jg-shop-glyph jg-shop-glyph--${GLYPHS[index % GLYPHS.length]}`} aria-hidden="true" />
        )}
        {!crop.image && <span className="jg-shop-photo">{lang === "ko" ? "사진 준비 중" : "PHOTO COMING"}</span>}
      </div>

      <div className="jg-crop-info">
        <div className="jg-crop-top">
          <div className="jg-crop-main">
            <span className="jg-crop-ref">{ref}</span>
            <h3 className="jg-crop-name">{crop.name[lang]}</h3>
            <p className="jg-crop-note">{crop.note[lang]}</p>
          </div>
          <div className="jg-crop-actions">
            <div className="jg-crop-price">{crop.price ? crop.price[lang] : lang === "ko" ? "가격 미정" : "PRICE TBA"}</div>
            <button type="button" className={`jg-crop-btn jg-crop-btn--primary${selected ? " is-active" : ""}`} aria-pressed={selected} onClick={onToggle}>
              {selected ? (lang === "ko" ? "✓ 대기 명단에 담김" : "✓ ON THE WAITLIST") : lang === "ko" ? "+ 대기 명단에 담기" : "+ ADD TO WAITLIST"}
            </button>
            <a className="jg-crop-btn" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
              {lang === "ko" ? "인스타그램에서 문의" : "ASK ON INSTAGRAM"}
            </a>
          </div>
        </div>
        <dl className="jg-crop-specs">
          {cells.map((cell) => (
            <div className="jg-crop-spec" key={cell.label}>
              <dt>{cell.label}</dt>
              <dd>{cell.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </article>
  );
}

export default function ShopPage() {
  const { lang } = useLanguage();
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const picked = CROPS.filter((c) => selected.includes(c.id));
  const pickedNames = picked.map((c) => c.name[lang]).join(", ");

  const waitlistHref =
    lang === "ko"
      ? mailto(
          "시즌 박스 대기 신청",
          `안녕하세요! 시즌 박스 대기 명단에 넣어주세요.\n\n이름:\n배송받을 지역:\n관심 있는 작물: ${pickedNames}\n`,
        )
      : mailto(
          "Seasonal box waitlist",
          `Hi! Please add me to the seasonal box waitlist.\n\nName:\nRegion (for shipping):\nCrops I'm interested in: ${pickedNames}\n`,
        );

  const details: { label: string; value: string }[] = [
    {
      label: "Order",
      value: lang === "ko" ? "이메일 대기 신청 // 아직 결제 없음" : "EMAIL WAITLIST // NO PAYMENT YET",
    },
    {
      label: "Seasonal box",
      value: lang === "ko" ? "검토 중 // 제철 작물을 묶어서 배송" : "UNDER CONSIDERATION // BUNDLED TO SAVE SHIPPING",
    },
    {
      label: "Shipping",
      value: lang === "ko" ? "제주에서 발송 // 택배비 약 6,000원" : "FROM JEJU // ABOUT ₩6,000 PER PARCEL",
    },
    {
      label: "Status",
      value: lang === "ko" ? "땅 찾는 중 // 첫 수확 시기 미정" : "LAND SEARCH IN PROGRESS // FIRST HARVEST TBA",
    },
  ];

  return (
    <>
      <SEOHead
        title="Shop | What's Growing Next"
        description="Crops planned on a small ecological farm in Jeju and how to join the waitlist for the first seasonal boxes."
        keywords={["ecological farming", "seasonal box", "Jeju", "rye", "kale", "honey", "waitlist"]}
        image="/api/og-image?title=Shop&category=Ecological Agriculture&author=San&excerpt=What's growing next"
        url={`${typeof window !== "undefined" ? window.location.origin : ""}/shop`}
        type="website"
        author="San"
      />
      <JejuShell
        headerLeft={["[SYSTEM] SHOP.V1", "[FOCUS] ECOLOGICAL AGRICULTURE"]}
        headerRight={["SEASONAL BOX", `SELECTED (${selected.length})`]}
      >
        <div className="jg-body">
          <main className="jg-main">
            <div className="jg-post jg-post--wide">
              <p className="jg-meta">{lang === "ko" ? "[SHOP] 작물" : "[SHOP] CROPS"}</p>
              <h1 className="jg-post-title jg-post-title--md">{lang === "ko" ? "다음에 자랄 것들." : "What's growing next."}</h1>
              <p className="jg-post-lede">
                {lang === "ko"
                  ? "아직 판매 중인 것은 없어요. 앞으로 기르려는 작물, 어떻게 여러분께 닿을지, 그리고 가장 먼저 만나는 방법을 솔직하게 적었습니다."
                  : "Nothing is for sale yet. This is the honest list of what I'm planning to grow, how it could reach you, and how to be first in line."}
              </p>

              <div className="jg-actions">
                <a
                  href="#waitlist"
                  className="jg-btn jg-btn--solid"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  {lang === "ko" ? "시즌 박스 대기 신청" : "Join the seasonal box waitlist"}
                </a>
                <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="jg-btn">
                  {lang === "ko" ? "인스타그램에서 문의" : "Ask on Instagram"}
                </a>
              </div>

              <section className="jg-box" aria-label="How to get it">
                <div className="jg-box-head">
                  <span className="jg-box-dot" aria-hidden="true" />
                  [H.T.G.] How to get it
                </div>
                <div className="jg-box-grid">
                  {details.map((d) => (
                    <div className="jg-box-cell" key={d.label}>
                      <span className="jg-box-label">{d.label}</span>
                      <span className="jg-box-value">{d.value}</span>
                    </div>
                  ))}
                </div>
              </section>

              <div className="jg-crop-list">
                {CROPS.map((crop, i) => (
                  <CropRow
                    key={crop.id}
                    crop={crop}
                    index={i}
                    lang={lang}
                    selected={selected.includes(crop.id)}
                    onToggle={() => toggle(crop.id)}
                  />
                ))}
              </div>

              <div className="jg-shop-band">
                <section id="waitlist" className="jg-shop-detail" aria-label="Seasonal box waitlist">
                  <div className="jg-shop-gallery">
                    <div className="jg-shop-media">
                      <span className="jg-shop-glyph jg-shop-glyph--triangle" aria-hidden="true" />
                    </div>
                    <div className="jg-shop-media">
                      <span className="jg-shop-glyph jg-shop-glyph--circle-tangerine" aria-hidden="true" />
                    </div>
                  </div>

                  <div className="jg-shop-info">
                    <h2 className="jg-shop-title">{lang === "ko" ? "시즌 박스." : "Seasonal box."}</h2>
                    <div className="jg-shop-priceline">
                      <span>COLLECTION // 001</span>
                      <strong>{lang === "ko" ? "가격 미정" : "PRICE TBA"}</strong>
                    </div>
                    <p className="jg-shop-desc">
                      {lang === "ko"
                        ? "제철에 나오는 작물을 작은 박스에 묶어 보내는 방식을 검토 중입니다. 궁금한 작물을 골라 두면, 가까워졌을 때 먼저 메일을 드립니다."
                        : "A small box of whatever is ripe, bundled to save shipping. Pick the crops you're curious about and I'll write when they're close."}
                    </p>
                    <p className="jg-shop-optlabel">{lang === "ko" ? "관심 작물 선택:" : "SELECT CROPS:"}</p>
                    <div className="jg-shop-options">
                      {CROPS.map((crop) => (
                        <button
                          key={crop.id}
                          type="button"
                          className={`jg-shop-opt${selected.includes(crop.id) ? " is-active" : ""}`}
                          aria-pressed={selected.includes(crop.id)}
                          onClick={() => toggle(crop.id)}
                        >
                          {crop.name[lang]}
                        </button>
                      ))}
                    </div>
                    <a href={waitlistHref} className="jg-shop-cta">
                      {lang === "ko" ? `대기 명단 신청 (${selected.length})` : `JOIN THE WAITLIST (${selected.length})`}
                    </a>
                    <div className="jg-shop-specs">
                      <div>{lang === "ko" ? "/// 준비 단계 — 아직 판매 중인 것 없음" : "/// PLANNING STAGE — NOTHING FOR SALE YET"}</div>
                      <div>{lang === "ko" ? "/// 열리기 전에 먼저 메일로 알려드려요" : "/// I'LL EMAIL YOU BEFORE ANYTHING OPENS"}</div>
                    </div>
                  </div>
                </section>

              </div>
            </div>
          </main>
        </div>
      </JejuShell>
    </>
  );
}
