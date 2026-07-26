export interface StickerItem {
  id: string;
  name: string;
  category: "Reactions" | "Badges" | "Objects & Tech" | "Vibes & Symbols";
  svgUrl: string;
}

const svgToDataUrl = (svgString: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(svgString.trim())}`;

export const FIGJAM_STICKERS: StickerItem[] = [
  // ── Reactions ─────────────────────────────────────────────────────────────
  {
    id: "sticker-fire",
    name: "Lit Fire",
    category: "Reactions",
    svgUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="fireOuter" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#FF3300" />
            <stop offset="60%" stop-color="#FF6E40" />
            <stop offset="100%" stop-color="#FF9E80" />
          </linearGradient>
          <linearGradient id="fireInner" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#FFD54F" />
            <stop offset="100%" stop-color="#FFF9C4" />
          </linearGradient>
        </defs>
        <path d="M52 6 C52 6 82 28 82 58 C82 80 65 94 48 94 C31 94 18 80 18 62 C18 44 34 30 36 30 C34 42 42 48 42 48 C42 48 52 36 52 6 Z" fill="url(#fireOuter)"/>
        <path d="M48 94 C59 94 66 84 66 68 C66 52 52 42 52 42 C52 42 56 52 50 60 C44 68 36 66 36 66 C36 78 40 94 48 94 Z" fill="url(#fireInner)"/>
      </svg>
    `),
  },
  {
    id: "sticker-joy",
    name: "Laughing Tears",
    category: "Reactions",
    svgUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="faceGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#FFD54F" />
            <stop offset="100%" stop-color="#FFB300" />
          </linearGradient>
          <linearGradient id="tearGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#4FC3F7" />
            <stop offset="100%" stop-color="#0288D1" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="42" fill="url(#faceGrad)"/>
        <path d="M25 38 Q33 26 41 38" fill="none" stroke="#3E2723" stroke-width="4.5" stroke-linecap="round"/>
        <path d="M59 38 Q67 26 75 38" fill="none" stroke="#3E2723" stroke-width="4.5" stroke-linecap="round"/>
        <path d="M28 52 C28 72 72 72 72 52 Z" fill="#3E2723"/>
        <path d="M30 52 L70 52 L68 58 Q50 60 32 58 Z" fill="#FFFFFF"/>
        <path d="M40 64 C40 56 60 56 60 64 C60 69 55 70 50 70 C45 70 40 69 40 64 Z" fill="#FF5252"/>
        <path d="M14 46 C14 46 2 56 6 68 C10 78 22 76 24 66 C26 56 14 46 14 46 Z" fill="url(#tearGrad)"/>
        <path d="M86 46 C86 46 98 56 94 68 C90 78 78 76 76 66 C74 56 86 46 86 46 Z" fill="url(#tearGrad)"/>
      </svg>
    `),
  },
  {
    id: "sticker-star",
    name: "Golden Star",
    category: "Reactions",
    svgUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="starSolid" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#FFD54F" />
            <stop offset="100%" stop-color="#FFB300" />
          </linearGradient>
        </defs>
        <path d="M50 10 L61 34 C62 36 64 37 66 37 L92 39 C95 39 96 43 94 45 L74 62 C72 63 71 66 72 68 L78 93 C78 96 75 98 72 96 L49 83 C47 82 45 82 43 83 L20 96 C17 98 14 96 14 93 L20 68 C21 66 20 63 18 62 L0 45 C-2 43 -1 39 2 39 L28 37 C30 37 32 36 33 34 L44 10 C45 7 49 7 50 10 Z" fill="url(#starSolid)"/>
      </svg>
    `),
  },
  {
    id: "sticker-question",
    name: "Question Mark",
    category: "Reactions",
    svgUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="qGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FF5252" />
            <stop offset="100%" stop-color="#D32F2F" />
          </linearGradient>
        </defs>
        <g transform="rotate(12, 50, 50)">
          <path d="M30 32 C30 16 70 16 70 34 C70 48 50 50 50 64 L50 68" fill="none" stroke="url(#qGrad)" stroke-width="16" stroke-linecap="round"/>
          <circle cx="50" cy="84" r="9" fill="url(#qGrad)"/>
        </g>
      </svg>
    `),
  },
  {
    id: "sticker-thumbs-down",
    name: "Thumbs Down",
    category: "Reactions",
    svgUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="thumbDownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#64B5F6" />
            <stop offset="100%" stop-color="#1976D2" />
          </linearGradient>
        </defs>
        <g transform="rotate(8, 50, 50)">
          <path d="M65 48 L65 14 C65 10 68 8 72 8 L78 8 C82 8 85 10 85 14 L85 48 Z" fill="#1565C0"/>
          <path d="M65 48 L50 78 C46 86 36 84 36 74 L38 52 L16 52 C10 52 6 46 8 40 L16 16 C18 12 22 10 26 10 L65 10 Z" fill="url(#thumbDownGrad)"/>
        </g>
      </svg>
    `),
  },
  {
    id: "sticker-thumbs-up",
    name: "Thumbs Up",
    category: "Reactions",
    svgUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="thumbUpGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FFD54F" />
            <stop offset="100%" stop-color="#FFB300" />
          </linearGradient>
        </defs>
        <g transform="rotate(-6, 50, 50)">
          <path d="M35 52 L35 86 C35 90 32 92 28 92 L22 92 C18 92 15 90 15 86 L15 52 Z" fill="#FFA000"/>
          <path d="M35 52 L50 22 C54 14 64 16 64 26 L62 48 L84 48 C90 48 94 54 92 60 L84 84 C82 88 78 90 74 90 L35 90 Z" fill="url(#thumbUpGrad)"/>
        </g>
      </svg>
    `),
  },
  {
    id: "sticker-heart",
    name: "Love Heart",
    category: "Reactions",
    svgUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FF477E" />
            <stop offset="100%" stop-color="#D8003F" />
          </linearGradient>
        </defs>
        <path d="M50 84 C50 84 14 62 14 36 C14 22 25 12 38 12 C46 12 50 18 50 18 C50 18 54 12 62 12 C75 12 86 22 86 36 C86 62 50 84 50 84 Z" fill="url(#heartGrad)"/>
        <path d="M26 30 Q32 20 42 22" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" opacity="0.6"/>
      </svg>
    `),
  },
  {
    id: "sticker-100",
    name: "100 Score",
    category: "Reactions",
    svgUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="redGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FF4B4B" />
            <stop offset="100%" stop-color="#D30000" />
          </linearGradient>
        </defs>
        <g transform="rotate(-6, 50, 50)">
          <text x="50" y="58" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="44" fill="url(#redGrad)" text-anchor="middle">100</text>
          <path d="M18 68 L82 68" stroke="#FFCA28" stroke-width="6" stroke-linecap="round"/>
          <path d="M26 80 L74 80" stroke="#FFCA28" stroke-width="6" stroke-linecap="round"/>
        </g>
      </svg>
    `),
  },
  {
    id: "sticker-clapping",
    name: "Clapping Hands",
    category: "Reactions",
    svgUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="clapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FFDF73" />
            <stop offset="100%" stop-color="#FFA800" />
          </linearGradient>
        </defs>
        <g transform="rotate(-15, 50, 50)">
          <path d="M30 70 L50 25 C52 20 58 20 60 25 L65 40 L75 35 C78 33 82 36 80 40 L65 75 Z" fill="#E69500"/>
          <path d="M25 75 L45 30 C47 25 53 25 55 30 L70 70 L45 85 Z" fill="url(#clapGrad)"/>
        </g>
        <path d="M15 25 L25 35" stroke="#FF5722" stroke-width="3" stroke-linecap="round"/>
        <path d="M30 15 L35 28" stroke="#FF5722" stroke-width="3" stroke-linecap="round"/>
        <path d="M75 18 L68 30" stroke="#FF5722" stroke-width="3" stroke-linecap="round"/>
      </svg>
    `),
  },

  // ── Badges ────────────────────────────────────────────────────────────────
  {
    id: "sticker-approved",
    name: "Approved Check",
    category: "Badges",
    svgUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#2ED573" />
            <stop offset="100%" stop-color="#20BF6B" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="40" fill="url(#greenGrad)"/>
        <path d="M32 50 L44 62 L68 36" fill="none" stroke="#FFFFFF" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `),
  },
  {
    id: "sticker-blocked",
    name: "Blocked Stop",
    category: "Badges",
    svgUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="stopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FF4757" />
            <stop offset="100%" stop-color="#E84118" />
          </linearGradient>
        </defs>
        <polygon points="30,12 70,12 88,30 88,70 70,88 30,88 12,70 12,30" fill="url(#stopGrad)"/>
        <path d="M32 32 L68 68" stroke="#FFFFFF" stroke-width="9" stroke-linecap="round"/>
        <path d="M68 32 L32 68" stroke="#FFFFFF" stroke-width="9" stroke-linecap="round"/>
      </svg>
    `),
  },
  {
    id: "sticker-plus-one",
    name: "+1 Agree",
    category: "Badges",
    svgUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="plusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1E90FF" />
            <stop offset="100%" stop-color="#006266" />
          </linearGradient>
        </defs>
        <rect x="12" y="20" width="76" height="60" rx="16" fill="url(#plusGrad)"/>
        <text x="50" y="63" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="38" fill="#FFFFFF" text-anchor="middle">+1</text>
      </svg>
    `),
  },
  {
    id: "sticker-trophy",
    name: "Trophy Winner",
    category: "Badges",
    svgUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="trophyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FFE169" />
            <stop offset="100%" stop-color="#EBA100" />
          </linearGradient>
        </defs>
        <path d="M30 84 L70 84 L64 74 L36 74 Z" fill="#C78900"/>
        <path d="M26 84 L74 84 L74 90 L26 90 Z" fill="#A37000"/>
        <path d="M28 16 L72 16 L66 54 Q50 66 34 54 Z" fill="url(#trophyGrad)"/>
        <path d="M28 22 C14 22 14 44 30 42" fill="none" stroke="url(#trophyGrad)" stroke-width="6" stroke-linecap="round"/>
        <path d="M72 22 C86 22 86 44 70 42" fill="none" stroke="url(#trophyGrad)" stroke-width="6" stroke-linecap="round"/>
        <polygon points="50,28 54,36 63,37 56,43 58,52 50,47 42,52 44,43 37,37 46,36" fill="#FFFFFF" opacity="0.9"/>
      </svg>
    `),
  },
  {
    id: "sticker-crown",
    name: "Regal Crown",
    category: "Badges",
    svgUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="crownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FFF066" />
            <stop offset="100%" stop-color="#F2A900" />
          </linearGradient>
        </defs>
        <path d="M16 74 L84 74 L90 32 L68 52 L50 22 L32 52 L10 32 Z" fill="url(#crownGrad)"/>
        <rect x="18" y="74" width="64" height="10" rx="3" fill="#D99000"/>
        <circle cx="50" cy="79" r="3.5" fill="#FF3838"/>
        <circle cx="34" cy="79" r="3.5" fill="#3867FF"/>
        <circle cx="66" cy="79" r="3.5" fill="#3867FF"/>
        <circle cx="50" cy="22" r="5" fill="#FF3838"/>
        <circle cx="10" cy="32" r="4.5" fill="#FFF066"/>
        <circle cx="90" cy="32" r="4.5" fill="#FFF066"/>
      </svg>
    `),
  },

  // ── Objects & Tech ────────────────────────────────────────────────────────
  {
    id: "sticker-lightbulb",
    name: "Great Idea Bulb",
    category: "Objects & Tech",
    svgUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="bulbGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#FFF89A" />
            <stop offset="100%" stop-color="#FFC300" />
          </linearGradient>
        </defs>
        <path d="M34 68 L66 68 L62 76 L38 76 Z" fill="#B0B0B0"/>
        <path d="M40 76 L60 76 L56 86 L44 86 Z" fill="#808080"/>
        <path d="M50 12 C34 12 22 24 22 40 C22 52 30 58 34 66 L66 66 C70 58 78 52 78 40 C78 24 66 12 50 12 Z" fill="url(#bulbGrad)"/>
        <path d="M50 2 L50 8" stroke="#FFC300" stroke-width="4.5" stroke-linecap="round"/>
        <path d="M18 20 L23 25" stroke="#FFC300" stroke-width="4.5" stroke-linecap="round"/>
        <path d="M82 20 L77 25" stroke="#FFC300" stroke-width="4.5" stroke-linecap="round"/>
        <path d="M10 40 L16 40" stroke="#FFC300" stroke-width="4.5" stroke-linecap="round"/>
        <path d="M90 40 L84 40" stroke="#FFC300" stroke-width="4.5" stroke-linecap="round"/>
        <path d="M38 32 Q50 24 62 32" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" opacity="0.8"/>
      </svg>
    `),
  },
  {
    id: "sticker-rocket",
    name: "Rocket Launch",
    category: "Objects & Tech",
    svgUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="rocketGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FFFFFF" />
            <stop offset="100%" stop-color="#E0E0E0" />
          </linearGradient>
        </defs>
        <g transform="rotate(45, 50, 50)">
          <path d="M35 65 L25 85 L45 75 Z" fill="#FF4757"/>
          <path d="M65 35 L85 25 L75 45 Z" fill="#FF4757"/>
          <path d="M35 65 Q50 15 85 15 Q85 50 65 65 L50 68 L32 50 Z" fill="url(#rocketGrad)"/>
          <path d="M70 15 L85 15 L85 30 Z" fill="#FF4757"/>
          <circle cx="60" cy="40" r="8" fill="#3742FA"/>
          <circle cx="60" cy="40" r="4" fill="#70A1FF"/>
          <path d="M32 68 L20 80 Q15 85 25 90 Q30 80 32 68 Z" fill="#FFA502"/>
        </g>
      </svg>
    `),
  },
  {
    id: "sticker-pushpin",
    name: "Red Pushpin",
    category: "Objects & Tech",
    svgUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="pinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FF6B81" />
            <stop offset="100%" stop-color="#FF4757" />
          </linearGradient>
        </defs>
        <g transform="rotate(30, 50, 50)">
          <path d="M48 60 L48 90" stroke="#707070" stroke-width="5" stroke-linecap="round"/>
          <path d="M30 40 L70 40 L60 60 L40 60 Z" fill="url(#pinGrad)"/>
          <rect x="34" y="24" width="32" height="16" rx="8" fill="url(#pinGrad)"/>
          <rect x="38" y="18" width="24" height="8" rx="4" fill="#FF6B81"/>
          <circle cx="44" cy="30" r="3" fill="#FFFFFF" opacity="0.6"/>
        </g>
      </svg>
    `),
  },
  {
    id: "sticker-speech",
    name: "Speech Bubble",
    category: "Objects & Tech",
    svgUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="bubbleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#70A1FF" />
            <stop offset="100%" stop-color="#1E90FF" />
          </linearGradient>
        </defs>
        <path d="M14 26 C14 18 24 14 50 14 C76 14 86 18 86 38 C86 58 76 66 50 66 C42 66 34 68 28 78 L26 78 L28 64 C18 62 14 54 14 38 Z" fill="url(#bubbleGrad)"/>
        <circle cx="36" cy="40" r="5.5" fill="#FFFFFF"/>
        <circle cx="50" cy="40" r="5.5" fill="#FFFFFF"/>
        <circle cx="64" cy="40" r="5.5" fill="#FFFFFF"/>
      </svg>
    `),
  },

  // ── Vibes & Symbols ───────────────────────────────────────────────────────
  {
    id: "sticker-cat",
    name: "Cute Kitty",
    category: "Vibes & Symbols",
    svgUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="catGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#FFA502" />
            <stop offset="100%" stop-color="#FF7F50" />
          </linearGradient>
        </defs>
        <polygon points="18,45 14,18 40,30" fill="url(#catGrad)"/>
        <polygon points="82,45 86,18 60,30" fill="url(#catGrad)"/>
        <polygon points="18,38 18,24 34,32" fill="#FFD2B8"/>
        <polygon points="82,38 82,24 66,32" fill="#FFD2B8"/>
        <ellipse cx="50" cy="56" rx="38" ry="30" fill="url(#catGrad)"/>
        <circle cx="36" cy="52" r="4.5" fill="#2F3542"/>
        <circle cx="64" cy="52" r="4.5" fill="#2F3542"/>
        <polygon points="47,60 53,60 50,64" fill="#FF4757"/>
        <path d="M44 67 Q50 73 56 67" fill="none" stroke="#2F3542" stroke-width="3" stroke-linecap="round"/>
        <path d="M16 58 L28 60" stroke="#2F3542" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M14 66 L28 64" stroke="#2F3542" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M84 58 L72 60" stroke="#2F3542" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M86 66 L72 64" stroke="#2F3542" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
    `),
  },
  {
    id: "sticker-unicorn",
    name: "Unicorn Magic",
    category: "Vibes & Symbols",
    svgUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="hornGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#FFE169" />
            <stop offset="100%" stop-color="#FFA000" />
          </linearGradient>
        </defs>
        <path d="M26 84 C26 84 36 60 48 50 C60 40 80 50 80 60 C80 76 60 88 40 88 Z" fill="#FFFFFF"/>
        <polygon points="46,52 75,15 58,50" fill="url(#hornGrad)"/>
        <path d="M52,42 L66,26" stroke="#C77D00" stroke-width="2"/>
        <path d="M56,48 L70,34" stroke="#C77D00" stroke-width="2"/>
        <path d="M26 64 C16 66 12 76 20 86 C12 90 26 96 36 88" fill="#FF6B81"/>
        <path d="M30 60 C22 60 18 68 24 76" fill="#70A1FF"/>
        <path d="M36 54 C30 54 26 62 30 68" fill="#2ED573"/>
        <circle cx="56" cy="62" r="3.5" fill="#2F3542"/>
        <path d="M64 68 Q60 74 54 72" fill="none" stroke="#2F3542" stroke-width="3" stroke-linecap="round"/>
      </svg>
    `),
  },
  {
    id: "sticker-avocado",
    name: "Happy Avocado",
    category: "Vibes & Symbols",
    svgUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="avoSkin" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1B6D24" />
            <stop offset="100%" stop-color="#0E4213" />
          </linearGradient>
          <linearGradient id="avoFlesh" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#DDF38A" />
            <stop offset="100%" stop-color="#A5D843" />
          </linearGradient>
          <linearGradient id="avoPit" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#8F5E36" />
            <stop offset="100%" stop-color="#5C3A1E" />
          </linearGradient>
        </defs>
        <path d="M50 12 C34 12 24 34 22 56 C20 74 34 88 50 88 C66 88 80 74 78 56 C76 34 66 12 50 12 Z" fill="url(#avoSkin)"/>
        <path d="M50 18 C38 18 30 36 28 56 C26 70 38 82 50 82 C62 82 74 70 72 56 C70 36 62 18 50 18 Z" fill="url(#avoFlesh)"/>
        <circle cx="50" cy="62" r="16" fill="url(#avoPit)"/>
        <circle cx="45" cy="59" r="2.5" fill="#FFFFFF"/>
        <circle cx="55" cy="59" r="2.5" fill="#FFFFFF"/>
        <path d="M46 66 Q50 70 54 66" fill="none" stroke="#4A2E16" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="44" cy="55" r="3" fill="#FFFFFF" opacity="0.4"/>
      </svg>
    `),
  },
  {
    id: "sticker-pizza",
    name: "Pizza Slice",
    category: "Vibes & Symbols",
    svgUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="crustGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#E17055" />
            <stop offset="100%" stop-color="#D63031" />
          </linearGradient>
          <linearGradient id="cheeseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FFEAA7" />
            <stop offset="100%" stop-color="#FDCB6E" />
          </linearGradient>
        </defs>
        <g transform="rotate(15, 50, 50)">
          <path d="M20 25 L80 25 L50 85 Z" fill="url(#crustGrad)"/>
          <path d="M24 32 L76 32 L50 80 Z" fill="url(#cheeseGrad)"/>
          <path d="M18 20 C35 15 65 15 82 20 L80 26 L20 26 Z" fill="#D35400"/>
          <circle cx="45" cy="45" r="6" fill="#D63031"/>
          <circle cx="58" cy="58" r="5" fill="#D63031"/>
          <circle cx="62" cy="40" r="5.5" fill="#D63031"/>
          <circle cx="46" cy="68" r="4.5" fill="#D63031"/>
          <circle cx="36" cy="54" r="4" fill="#009432" opacity="0.8"/>
          <circle cx="54" cy="48" r="3" fill="#009432" opacity="0.8"/>
        </g>
      </svg>
    `),
  },
  {
    id: "sticker-rainbow",
    name: "Rainbow Arch",
    category: "Vibes & Symbols",
    svgUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <path d="M15 70 A 35 35 0 0 1 85 70" fill="none" stroke="#FF4757" stroke-width="7" stroke-linecap="round"/>
        <path d="M22 70 A 28 28 0 0 1 78 70" fill="none" stroke="#FFA502" stroke-width="7" stroke-linecap="round"/>
        <path d="M29 70 A 21 21 0 0 1 71 70" fill="none" stroke="#2ED573" stroke-width="7" stroke-linecap="round"/>
        <path d="M36 70 A 14 14 0 0 1 64 70" fill="none" stroke="#1E90FF" stroke-width="7" stroke-linecap="round"/>
        <circle cx="16" cy="72" r="10" fill="#FFFFFF"/>
        <circle cx="26" cy="74" r="8" fill="#FFFFFF"/>
        <circle cx="8" cy="74" r="7" fill="#FFFFFF"/>
        <circle cx="84" cy="72" r="10" fill="#FFFFFF"/>
        <circle cx="74" cy="74" r="8" fill="#FFFFFF"/>
        <circle cx="92" cy="74" r="7" fill="#FFFFFF"/>
      </svg>
    `),
  },
  {
    id: "sticker-boom",
    name: "BOOM Starburst",
    category: "Vibes & Symbols",
    svgUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="boomGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FFF200" />
            <stop offset="100%" stop-color="#FF9F00" />
          </linearGradient>
        </defs>
        <path d="M50 6 L59 28 L82 14 L72 35 L94 45 L72 55 L82 76 L59 62 L50 84 L41 62 L18 76 L28 55 L6 45 L28 35 L18 14 L41 28 Z" fill="#FF2A00"/>
        <path d="M50 14 L57 32 L75 20 L67 38 L86 45 L67 52 L75 70 L57 58 L50 76 L43 58 L25 70 L33 52 L14 45 L33 38 L25 20 L43 32 Z" fill="url(#boomGrad)"/>
        <text x="50" y="53" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="18" fill="#2F3542" text-anchor="middle" transform="rotate(-5, 50, 50)">BOOM!</text>
      </svg>
    `),
  },
];
