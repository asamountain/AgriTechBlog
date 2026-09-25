import { useState, useEffect, useCallback } from "react";
import JejuShell from "@/components/jeju-shell";
import { useLanguage } from "@/contexts/language-context";

interface TimelineEntry {
  year: string;
  imageId: string;
  title: { en: string; ko: string };
  story: { en: string; ko: string };
  accent?: string;
}

const TIMELINE: TimelineEntry[] = [
  {
    year: "2017–2021",
    imageId: "marketing",
    title: {
      en: "Performance Marketing, YouTube & a Permaculture Garden",
      ko: "퍼포먼스 마케팅 · 유튜브 · 퍼머컬처 밭",
    },
    story: {
      en: "Discovered the explosive power of data and automation — Python, Selenium, precision marketing. Built a cat rescue YouTube channel from zero to 4,500 subscribers and secured $2,000/month in sponsorships. But when the structure lacked substance, I walked away. \"Structures without integrity don't last.\" Around the same time I built a hügelkultur mound and grew a permaculture garden with my own hands.",
      ko: "데이터와 자동화의 폭발적인 힘을 체험했습니다 — Python, Selenium, 정밀 마케팅. 고양이 구조 유튜브를 0에서 4,500명까지 키우고 월 $2,000 스폰서십을 수주했습니다. 하지만 알맹이 없는 구조는 오래 못 간다는 걸 깨닫고 떠났습니다. 같은 시기에 후겔쿨투어(hügelkultur) 둔덕을 직접 만들며 퍼머컬처 밭을 직접 일궜습니다.",
    },
  },
  {
    year: "2021–2022",
    imageId: "yeongwol",
    title: {
      en: "Yeongwol — Farm Community Building",
      ko: "영월 청년마을만들기",
    },
    story: {
      en: "Asked \"why\" before anything else. Discovered a leaf-field image that became the core story — it won government grants. Contacted David Holmgren's permaculture foundation directly. When you dig deep into \"why,\" you find value no one else can see.",
      ko: "\"왜\"부터 파고들었습니다. 나뭇잎 밭 이미지를 스토리의 핵심으로 설계해 지원금을 수주했습니다. David Holmgren 퍼머컬처 재단에 영어로 직접 컨택했습니다. \"왜\"를 깊이 파고들면 아무도 보지 못한 가치가 보입니다.",
    },
  },
  {
    year: "2022",
    imageId: "farming-exploration",
    title: {
      en: "Farming Exploration — Across Korea",
      ko: "창농 탐색 — 양평, 거제, 제주, 완주",
    },
    story: {
      en: "Completed 550 hours of government farming education. Led SK Social Impact Index grant application (passed first round). In Geoje, an elder offered me a 50-hive bee farm for \u20A9300M — beautiful, but the ROI was unclear. The dream was vivid; the economics weren't.",
      ko: "농림부 귀농 정규 교육 550시간을 수료했습니다. SK 사회성과 지표 지원사업 1차 서류를 통과했습니다. 거제에서 벌통 50동 농가를 3억에 제안받았지만, 투자 회수가 불투명했습니다. 이상은 아름다웠지만 현실에서 독립적이지 못했습니다.",
    },
  },
  {
    year: "2022–2023",
    imageId: "justbe",
    title: {
      en: "JustBe Temple, Hongdae — Eco-Community",
      ko: "JustBe Temple (홍대) — 에코 커뮤니티",
    },
    story: {
      en: "Built a rooftop garden from scratch — 21 varieties of herbs and native plants, bokashi compost cycling, connected with vegan potluck gatherings the head monk had run for decades. Started alone, invited others, grew it into a living community. Here I met my American wife. Together we dream of a farm in California.",
      ko: "옥상 허브 정원을 처음부터 만들었습니다 — 21종의 허브와 토종 식물, 보카시 퇴비 순환 구조. 혼자 시작해서 사람들을 합류시키며 살아있는 커뮤니티로 키웠습니다. 이곳에서 미국인 아내를 만났습니다. 함께 캘리포니아에서 농장을 꿈꿉니다.",
    },
  },
  {
    year: "2024",
    imageId: "workaway",
    title: {
      en: "Permaculture Farms — Thailand & Malaysia",
      ko: "퍼머컬처 농장 — 태국 · 말레이시아",
    },
    story: {
      en: "Four months on Workaway farms across Southeast Asia. Witnessed how nature \u00D7 design can transform entire ecosystems. But most farmers I met couldn't sustain themselves — the ideals were beautiful, the economics weren't. The conviction crystallized: without tech, farming can't work at scale.",
      ko: "동남아 퍼머컬처 농장에서 4개월. 자연과 설계의 결합이 생태계 전체를 바꾸는 과정을 목격했습니다. 하지만 직접 만난 농가 대부분이 자급자족도, 충분한 수입도 얻지 못하는 현실. 확신이 굳어졌습니다 — 테크 없이는 안 된다.",
    },
  },
  {
    year: "2026.08.21",
    imageId: "cheongchangnong",
    title: {
      en: "Young Entrepreneur Farmer — Western Jeju",
      ko: "청년창업농 시작 — 제주 서부",
    },
    story: {
      en: "Started as a Young Entrepreneur Farmer (청창농) in western Jeju. Now I'm looking for land and preparing a diversified, small-plot farm — every piece of the path so far pointing here.",
      ko: "제주 서부에서 청년창업농(청창농)으로 첫걸음을 뗐습니다. 지금은 땅을 찾고, 다품목 소량생산 농장을 준비하고 있습니다. 지금까지의 모든 길이 이곳을 향해 있었습니다.",
    },
  },
];

interface Bilingual {
  en: string;
  ko: string;
}

const PRINCIPLES: { label: string; value: Bilingual }[] = [
  {
    label: "Abundance",
    value: {
      en: "Connection, giving, and always having something left after the gift",
      ko: "사람들과의 연결, 나눔, 넉넉히 나눠도 늘 남는 삶",
    },
  },
  {
    label: "Competence",
    value: {
      en: "Running my own venture: trying, failing, growing",
      ko: "직접 경영하며 시도하고, 실패하고, 성장하는 삶",
    },
  },
  {
    label: "Nature × Tech",
    value: {
      en: "Solarpunk: nature and machine making abundance together",
      ko: "솔라펑크 — 자연과 기술이 함께 만드는 풍요",
    },
  },
  {
    label: "Independence",
    value: {
      en: "Building my own ground instead of building other people's dreams",
      ko: "남의 꿈이 아니라 내 터를 일구는 삶",
    },
  },
];

interface DirectionEntry {
  heading: Bilingual;
  body: { en: string[]; ko: string[] };
  list?: boolean;
  image?: { src: string; alt: Bilingual; caption: Bilingual };
}

const DIRECTION: DirectionEntry[] = [
  {
    heading: { en: "Why a farmer", ko: "왜 농부인가" },
    image: {
      src: "/images/about/childhood-with-cat.jpg",
      alt: { en: "Me as a small child, holding my cat", ko: "어린 시절, 고양이를 안고 있는 나" },
      caption: { en: "FIG.02 — ME AND MY CAT", ko: "FIG.02 — 어린 시절, 고양이와" },
    },
    body: {
      en: [
        "Animals and plants don't lie — good or bad, they are exactly what they are. Whenever life got hard, in the army and after, plants kept teaching me: broken, they still sprout in gaps nobody notices, take root without complaint, and bloom.",
        "Farming was my first pick as a kid, and it turned out to hold everything I've gathered — code, photo and video, data analysis. It's a lifelong job that's hard for AI to generalize, and one I can grow slowly and widely alongside other technologies. Nature gives solar energy away for free; if I understand its systems well enough, I can feed more than just myself and help solve problems around me.",
      ],
      ko: [
        "동물과 식물은 거짓말을 하지 않습니다. 좋으면 좋은 대로, 힘들면 힘든 대로 정직합니다. 군 생활 때도, 삶이 힘들 때마다 식물은 저에게 가르침을 줬습니다. 꺾여도, 아무도 알아보지 않는 틈에서도 싹을 틔우고, 군말 없이 제 자리에 뿌리를 내리고 꽃을 피웁니다.",
        "어릴 때 적성 1순위도 농부였고, 지금까지 쌓은 코딩, 사진·영상, 데이터 분석을 한 그릇에 담을 수 있는 직업입니다. AI가 일반화하기 어려운 평생 직업이고, 빨리빨리보다 천천히 넓게 풍요롭게 다른 기술과 접목해 키워나갈 수 있습니다. 자연이 무료로 내어주는 태양에너지로 생산을 시작할 수 있고, 자연의 원리를 제대로 이해하면 나 하나 먹고사는 데서 그치지 않고 주변을 먹이고 사회의 문제도 풀 수 있다고 믿습니다.",
      ],
    },
  },
  {
    heading: { en: "Why Jeju", ko: "왜 제주인가" },
    body: {
      en: [
        "A place where my partner can be welcomed: open to diversity and to people from many countries. On my working holiday in France I fell for that variety — different standards of beauty, people from everywhere, never boring. As a tourism island, Jeju is culturally open and multicultural.",
        "I wanted mountains, sea, rivers and fields together, because abundance follows ecological variety. I also wanted subtropical crops: my time in Bali taught me the value of that kind of health — papaya, banana, mangosteen, dragon fruit. And I know how hard cold places are on the body, from frostbitten toes in the army to frozen pipes in Paju.",
      ],
      ko: [
        "파트너가 받아들여질 수 있는 곳, 다양성을 받아들이는 곳이 필요했습니다. 프랑스 워킹홀리데이에서 다양함이 주는 매력을 알게 됐습니다 — 다양한 미의 기준, 다양한 국적의 사람들, 질리지 않는 곳. 제주는 관광의 섬이라 외국인에게도 열려 있고 문화적으로 풍요로운 곳입니다.",
        "산, 바다, 강, 들이 모두 있는 곳을 원했습니다. 생태의 다양한 요소가 있는 곳에 풍요도 있기 때문입니다. 아열대 작물도 희망했습니다. 따뜻한 발리에서 파파야, 바나나, 망고스틴, 용과가 주는 건강함이 좋았고, 강원도 군생활의 발가락 동상, 파주의 동파처럼 추운 곳의 괴로움도 겪어봤습니다.",
      ],
    },
  },
  {
    heading: { en: "Why ecological farming", ko: "왜 생태농업인가" },
    body: {
      en: [
        "It matches my values — diversity. And I saw the possibility first-hand on Workaway farms abroad: small-scale, many-crop growing, permaculture farms like Bec Hellouin in France and Krameterhof in Switzerland. Some of them started from almost nothing; it was a question of will.",
        "Ecological farming is often written off as low-yield. But add processing, community, and technology — sensors, automation, data — and I believe it can become real, stable income.",
      ],
      ko: [
        "가치관이 맞습니다. 다양성입니다. 그리고 해외 Workaway 농장에서 가능성을 직접 봤습니다. 다품종 소량생산, 프랑스 벡 엘루앙이나 스위스 Krameterhof 같은 퍼머컬처 농장들. 아무것도 없이 시작한 곳도 있었고, 결국 의지의 문제였습니다.",
        "생태농업은 수확량이 적다고들 하지만, 가공과 커뮤니티, 그리고 센서·자동화·데이터 같은 기술을 더하면 실제 안정적인 소득이 될 수 있다고 믿습니다.",
      ],
    },
  },
  {
    heading: { en: "Why now", ko: "왜 지금인가" },
    body: {
      en: [
        "I recently got married, and we need a place to settle. City life meant not being able to do what I love. It also feels like the right moment: in the age of AI, starting your own venture is encouraged. I passed the Young Entrepreneur Farmer program, so the only thing left is to begin — and I can keep coding with AI along the way.",
      ],
      ko: [
        "최근 결혼했고, 함께 살 정착지가 필요합니다. 도시에서 살며 느낀 건 좋아하는 것들을 할 수 없다는 괴로움이었습니다. 대 AI 시대, 창업을 권하는 타이밍이기도 합니다. 마침 청년창업농에도 합격했으니 이제 시작만 하면 됩니다. AI를 활용해 코딩도 계속 해나갈 수 있습니다.",
      ],
    },
  },
  {
    heading: { en: "Harder than I thought", ko: "생각보다 어려운 것들" },
    list: true,
    body: {
      en: [
        "Without land nothing can start. Fruit trees are hard to plant on land that isn't mine, so the planting systems I imagined can't be tried right away.",
        "Passing the program doesn't create income by itself. Some kind people advised me to grow tangerines and earn steadily first.",
        "Jeju's groundwater is scarce and precious, and livestock is a sensitive issue on a tourism island — ecological farming here has many limits.",
        "Tropical crops can't survive freezing winters outside a greenhouse. Cold-tolerant tropicals exist, but many are labor-heavy, cheap, or slow to mature.",
        "Shipping from the island costs around ₩6,000, so selling to the mainland needs a real premium.",
        "AI video isn't automatic: it takes a lot of tokens and, in the end, a human hand for the finish.",
        "Boundaries matter. When you can code, shoot video and speak languages, everyone wants to borrow you. I said yes to everything and burned out — I'm learning to say no, carefully.",
      ],
      ko: [
        "땅이 없으면 아무것도 시작할 수 없습니다. 내 땅이 아니면 과수를 심기도 어려워서, 생각했던 식재 방식을 곧장 시도해볼 수 없습니다.",
        "청년창업농이 되었다고 바로 돈이 만들어지는 구조는 아닙니다. 차라리 감귤로 당장 소득을 만들어가며 하라는 소중한 조언도 들었습니다.",
        "제주는 지하수가 중요하고 많지 않은 자원이며, 관광지라 가축 문제에 매우 민감합니다. 생태농업을 마음껏 할 수 있는 공간은 아니고 제한이 많습니다.",
        "열대 작물은 겨울에 영하로 떨어지면 온실이 아닌 곳에서는 얼어 죽습니다. 저온형 열대 작물도 손이 많이 가거나, 가격이 싸거나, 오래 길러야 하는 경우가 많습니다.",
        "도서산간 배송비가 약 6,000원입니다. 육지로 팔려면 분명한 프리미엄이 있어야 합니다.",
        "AI로 영상을 만든다고 저절로 예쁘게 나오지 않습니다. 토큰도 많이 들고, 결국 사람 손의 섬세한 마무리가 필요합니다.",
        "경계를 지키는 것이 중요합니다. 컴퓨터, 카메라, 외국어를 다룰 줄 알면 여기저기서 데려다 쓰려 합니다. 모든 곳에 Yes라고 하다 번아웃이 왔고, 조심스럽게 No라고 말하는 법을 배우고 있습니다.",
      ],
    },
  },
  {
    heading: { en: "What failure means to me", ko: "나에게 실패란" },
    body: {
      en: [
        "Failure isn't earning a little less; a little short but at peace is best. Failure is misjudging so badly that I'm buried in debt, anxious and afraid every day, and lose my peace of mind. It's also drifting — growing older while doing nothing each day. That won't happen.",
        "Surviving as a farmer means calculating, measuring, forecasting, managing risk, and thriving together with the people around you. I've been assembling this life piece by piece from my past, and the growth from continuing to try will be the real return.",
      ],
      ko: [
        "조금 부족해도 마음이 편안한 게 최고입니다. 제가 생각하는 실패는 지독하게 오판해서 수억 원의 빚에 매일 허덕이고 불안해하며 마음의 평화를 모두 잃는 것, 그리고 하루하루 나태해져서 아무것도 안 하고 나이만 먹어가는 것입니다. 그런 일은 없을 겁니다.",
        "농부로서 생존한다는 건 계산하고 측량하고 예측하고 추정하며, 리스크를 관리하고, 주변 사람들과 상생해나가는 일입니다. 저는 이 삶을 과거부터 조금씩 퍼즐을 맞춰왔고, 계속 시도하는 과정에서 얻는 성장이 클 것입니다.",
      ],
    },
  },
  {
    heading: { en: "What I'm doing now", ko: "지금 하고 있는 일" },
    list: true,
    body: {
      en: [
        "Looking for land. Once it comes, I want to plant autumn and winter crops and learn whether they grow, and whether I have the stamina to grow them.",
        "Testing rye and hairy vetch together as green manure: on a plot of about 400–500 pyeong, is that enough fertility without outside compost? Can rye really become bread, and its straw a healthy mulch?",
        "Keeping bees: will they thrive, will the honey come? And can a plot this size cover our basic energy needs, with room for extra income to fund next year?",
        "Deciding how to sell: a web page that tells our world and our food in detail, alongside a marketplace store. I'd rather run both and let the data say which works better.",
        "Going slowly and naturally, at my own pace, instead of rushing into burnout.",
      ],
      ko: [
        "땅을 알아보고 있습니다. 땅이 나오면 가을·겨울 작물을 심어보고, 잘 자라는지, 그걸 기를 체력과 여력이 되는지 확인하려 합니다.",
        "호밀과 헤어리베치를 함께 뿌렸을 때, 400~500평 밭에서 외부 퇴비 없이도 충분한지 시험해보려 합니다. 호밀로 실제 빵을 만들 수 있는지, 호밀 짚으로 멀칭이 건강하게 되는지도요.",
        "벌통을 두고 벌도 함께 기를 계획입니다. 잘 자랄지, 꿀이 잘 나올지, 이 규모의 땅에서 기본 에너지를 자급할 수 있는지, 다음 해에도 이어갈 부가 소득을 만들 수 있는지 윤곽을 그려보는 중입니다.",
        "판매는 우리의 세계관과 음식을 자세히 설명할 수 있는 웹페이지와 쇼핑몰을 함께 운영해보고, 데이터를 보며 어느 쪽이 나은지 판단하려 합니다.",
        "급하게 가다 번아웃이 되기보다, 제 흐름에 맞춰 천천히 자연스럽게 가려 합니다.",
      ],
    },
  },
];

const HOW_GRID: { label: Bilingual; value: Bilingual }[] = [
  {
    label: { en: "No chemical pesticides", ko: "화학 농약 없이" },
    value: {
      en: "Keep natural enemies and let the ecosystem balance the pests",
      ko: "천적과 생태계를 살려서 해충이 스스로 균형을 잡게 해요",
    },
  },
  {
    label: { en: "No herbicides", ko: "제초제 없이" },
    value: {
      en: "Cover crops and mulch instead of spraying weeds",
      ko: "풀은 뿌려 죽이지 않고, 피복작물과 멀칭으로 다스려요",
    },
  },
  {
    label: { en: "No-till", ko: "무경운" },
    value: {
      en: "Leave the soil structure alone and let roots do the work",
      ko: "흙을 갈아엎지 않고, 뿌리가 일하게 둬요",
    },
  },
  {
    label: { en: "Permaculture × horticulture", ko: "퍼머컬처 × 원예" },
    value: {
      en: "Many crops on a small plot, designed to support each other",
      ko: "작은 땅에 여러 작물을 서로 돕도록 설계해요",
    },
  },
];

const HOW_STEPS: { heading: Bilingual; body: { en: string; ko: string } }[] = [
  {
    heading: { en: "Let time and microbes build the soil", ko: "시간과 미생물이 흙을 만들게 합니다" },
    body: {
      en: "I don't want to force fertility with chemicals. With no-till and living roots in the ground, I believe microbes slowly turn the soil fertile on their own, and a fertile soil grows plenty of healthy food, given time. Rye and hairy vetch are where I'll start: they feed the soil, and their straw becomes mulch.",
      ko: "화학 자재로 억지로 땅을 비옥하게 만들고 싶지 않습니다. 땅을 갈아엎지 않고 뿌리가 늘 살아 있게 두면, 시간이 지나며 미생물이 흙을 스스로 비옥하게 만들고, 비옥한 흙은 건강한 먹거리를 넉넉히 내어준다고 믿습니다. 시작은 호밀과 헤어리베치예요. 흙을 살리고, 그 짚은 멀칭이 됩니다.",
    },
  },
  {
    heading: { en: "No poisons — the ecosystem does the work", ko: "농약도 제초제도 쓰지 않아요" },
    body: {
      en: "No chemical pesticides and no herbicides. Instead I keep the ecosystem alive: natural enemies, diverse plants, living soil. Whether this can still make a living is the open question this whole site is about, so I'll measure it and share what I learn.",
      ko: "화학 농약도 제초제도 쓰지 않습니다. 대신 천적, 다양한 식물, 살아 있는 흙 같은 생태계를 살려둡니다. 이렇게 하고도 생계가 되는지가 이 사이트가 다루는 열린 질문이고, 직접 재고 기록해서 나누겠습니다.",
    },
  },
  {
    heading: { en: "Design with permaculture and horticulture", ko: "퍼머컬처와 원예로 설계합니다" },
    body: {
      en: "Permaculture gives the layout: diverse crops on a small plot, each helping the others. Horticulture gives the craft: how to grow, tend and harvest each crop well. Together they let a small plot stay varied and productive without leaning on outside inputs.",
      ko: "퍼머컬처는 전체 설계를 줍니다. 작은 땅에 여러 작물이 서로 돕도록 배치하는 것이죠. 원예는 기술을 줍니다. 각 작물을 잘 기르고, 돌보고, 수확하는 방법입니다. 둘을 합치면 작은 땅에서도 외부 자재에 기대지 않고 다양하고 알찬 농사를 지을 수 있다고 봅니다.",
    },
  },
  {
    heading: { en: "Grow what adds the most value, first", ko: "부가가치가 가장 큰 작물부터 먼저" },
    body: {
      en: "A small plot can't grow everything at once, so I'll pick crops by the value they can add: what people actually want to buy, what grows well here without heavy inputs, how much labor it takes, and whether it can be processed (dried, brewed, pressed, baked) so quality stays steady. I test each crop small first, learn from local growers, and sell only what I trust.",
      ko: "작은 땅에서 모든 걸 한꺼번에 기를 수는 없어서, 부가가치가 큰 작물부터 고릅니다. 사람들이 실제로 사고 싶어 하는지, 자재를 많이 쓰지 않고도 이 땅에서 잘 자라는지, 노동이 얼마나 드는지, 말리기·차·즙·빵처럼 가공해서 품질을 일정하게 만들 수 있는지를 봅니다. 작게 시험 재배하고, 현지 농가에게 배우고, 믿을 수 있는 것만 팝니다.",
    },
  },
];

type ImageMap = Record<string, string[]>;

// Remote timeline photos that are served from a local copy in /public instead.
const LOCAL_IMAGE_OVERRIDES: Record<string, string> = {
  "https://res.cloudinary.com/dt8sr1dil/image/upload/v1773396740/agritech-blog/ot0utftc04pjyntu0uqg.jpg":
    "/images/about/yeongwol-field-filming.jpg",
  "https://res.cloudinary.com/dt8sr1dil/image/upload/v1773395830/agritech-blog/xbnisfeistv5topljqks.png":
    "/images/about/workaway-permaculture-class.jpg",
};

const LABEL_KO: Record<string, string> = {
  Abundance: "풍요",
  Competence: "유능감",
  "Nature × Tech": "자연 × 기술",
  Independence: "독립",
};

const pad = (n: number) => String(n).padStart(2, "0");

function TimelineItem({
  entry,
  index,
  images,
  lang,
}: {
  entry: TimelineEntry;
  index: number;
  images: string[];
  lang: "ko" | "en";
}) {
  const [expandedImg, setExpandedImg] = useState<string | null>(null);

  return (
    <div className="jg-tl-item">
      <div className="jg-tl-when">
        <span className="jg-tl-index">{`[${pad(index + 1)}]`}</span>
        <span className="jg-tl-year">{entry.year}</span>
      </div>
      <div className="jg-tl-body">
        <h3 className="jg-tl-title">{entry.title[lang]}</h3>
        <p className="jg-tl-story">{entry.story[lang]}</p>

        {images.length > 0 && (
          <div className="jg-tl-images">
            {images.map((url, i) => (
              <button
                key={i}
                type="button"
                className="jg-tl-thumb"
                onClick={() => setExpandedImg(expandedImg === url ? null : url)}
                aria-label={`${entry.title[lang]} — image ${i + 1}`}
              >
                <img src={url} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        )}

        {expandedImg && (
          <button type="button" className="jg-tl-expanded" onClick={() => setExpandedImg(null)}>
            <img src={expandedImg} alt="" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function AboutPage() {
  const { lang } = useLanguage();
  const [imageMap, setImageMap] = useState<ImageMap>({});

  useEffect(() => {
    fetch("/api/admin/timeline-images")
      .then((r) => (r.ok ? r.json() : {}))
      .then((data: Record<string, { images: string[] }>) => {
        const map: ImageMap = {};
        for (const [id, v] of Object.entries(data)) {
          const imgs = (v.images || []).filter(Boolean);
          if (imgs.length) map[id] = imgs;
        }
        setImageMap(map);
      })
      .catch(() => {});
  }, []);

  const getImages = useCallback(
    (imageId: string) => (imageMap[imageId] || []).map((url) => LOCAL_IMAGE_OVERRIDES[url] ?? url),
    [imageMap]
  );

  return (
    <JejuShell
      headerLeft={["[SYSTEM] PROFILE.V1", "[FOCUS] ECOLOGICAL AGRICULTURE"]}
      headerRight={["ENTRY // ABOUT", "SEUNGJIN YOUN"]}
    >
      <div className="jg-body">
        <main className="jg-main">
          <div className="jg-post">
            <p className="jg-meta">{lang === "ko" ? "[ABOUT] 소개" : "[ABOUT] PROFILE"}</p>
            <h1 className="jg-post-title">{lang === "ko" ? "윤승진." : "SeungJin Youn."}</h1>
            <p className="jg-post-lede">
              {lang === "ko"
                ? "사회적 일을 하다 농업으로, 그리고 테크로."
                : "From social impact to agriculture, then to tech."}
            </p>
            <p className="jg-post-sub">
              {lang === "ko"
                ? "농사를 짓는 사람이 아니라, 농업이 제대로 작동할 수 있는 인프라를 만드는 사람이 되기로 했습니다."
                : "I decided to become not the farmer, but the one who builds the infrastructure that makes farming actually work."}
            </p>

            <div className="jg-actions">
              <a href="mailto:sjisyours@gmail.com" className="jg-btn jg-btn--solid">
                sjisyours@gmail.com
              </a>
              <a href="https://github.com/asamountain" target="_blank" rel="noopener noreferrer" className="jg-btn">
                GitHub
              </a>
            </div>


            <section className="jg-section">
              <h2 className="jg-section-title">{lang === "ko" ? "주요 이정표" : "Key milestones"}</h2>
              <div className="jg-timeline">
                {[...TIMELINE].reverse().map((entry, i) => (
                  <TimelineItem key={entry.imageId} entry={entry} index={i} images={getImages(entry.imageId)} lang={lang} />
                ))}
              </div>
            </section>

            <section className="jg-section">
              <p className="jg-label">{lang === "ko" ? "[DIRECTION] 2026년 9월, 나의 마인드맵에서" : "[DIRECTION] FROM MY MIND MAP, SEPT 2026"}</p>
              <h2 className="jg-section-title">{lang === "ko" ? "내가 향하는 삶" : "The life I'm building toward"}</h2>
              <section className="jg-box" aria-label="Direction">
                <div className="jg-box-head">
                  <span className="jg-box-dot" aria-hidden="true" />
                  [D.I.R.] Direction
                </div>
                <div className="jg-box-grid">
                  {PRINCIPLES.map((p) => (
                    <div className="jg-box-cell" key={p.label}>
                      <span className="jg-box-label">{lang === "ko" ? LABEL_KO[p.label] ?? p.label : p.label}</span>
                      <span className="jg-box-value">{p.value[lang]}</span>
                    </div>
                  ))}
                </div>
              </section>
            </section>

            <section className="jg-section">
              <p className="jg-label">{lang === "ko" ? "[H.O.W.] 농사 방식" : "[H.O.W.] THE METHOD"}</p>
              <h2 className="jg-section-title">{lang === "ko" ? "농장을 만드는 방법" : "How the farm is made"}</h2>
              <section className="jg-box" aria-label="Method">
                <div className="jg-box-head">
                  <span className="jg-box-dot" aria-hidden="true" />
                  {lang === "ko" ? "[H.O.W.] 기본 원칙" : "[H.O.W.] Principles"}
                </div>
                <div className="jg-box-grid">
                  {HOW_GRID.map((g) => (
                    <div className="jg-box-cell" key={g.label.en}>
                      <span className="jg-box-label">{g.label[lang]}</span>
                      <span className="jg-box-value">{g.value[lang]}</span>
                    </div>
                  ))}
                </div>
              </section>
              {HOW_STEPS.map((step, i) => (
                <section className="jg-box" key={step.heading.en} aria-label={step.heading.en}>
                  <div className="jg-box-head">
                    <span className="jg-box-dot" aria-hidden="true" />
                    {`[${pad(i + 1)}] ${step.heading[lang]}`}
                  </div>
                  <div className="jg-summary">
                    <p>{step.body[lang]}</p>
                  </div>
                </section>
              ))}
            </section>

            <section className="jg-section">
              <p className="jg-label">{lang === "ko" ? "[Q&A] 스스로에게 묻고 답하기" : "[Q&A] QUESTIONS I ASK MYSELF"}</p>
              <h2 className="jg-section-title">{lang === "ko" ? "왜, 그리고 현실" : "Why, and the hard parts"}</h2>
              {DIRECTION.map((entry, i) => (
                <section className="jg-box" key={i} aria-label={entry.heading.en}>
                  <div className="jg-box-head">
                    <span className="jg-box-dot" aria-hidden="true" />
                    {`[${pad(i + 1)}] ${entry.heading[lang]}`}
                  </div>
                  <div className={`jg-summary${entry.image ? " jg-summary--media" : ""}`}>
                    {entry.image && (
                      <figure className="jg-fig">
                        <img src={entry.image.src} alt={entry.image.alt[lang]} loading="lazy" />
                        <figcaption className="jg-hero-tag">{entry.image.caption[lang]}</figcaption>
                      </figure>
                    )}
                    <div className="jg-summary-text">
                      {entry.list ? (
                        <ul className="jg-qa-list">
                          {entry.body[lang].map((line, j) => (
                            <li key={j}>{line}</li>
                          ))}
                        </ul>
                      ) : (
                        entry.body[lang].map((para, j) => <p key={j}>{para}</p>)
                      )}
                    </div>
                  </div>
                </section>
              ))}
            </section>

          </div>
        </main>
      </div>
    </JejuShell>
  );
}
