export interface NavItem {
  href: string;
  label: string;
  emoji: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", emoji: "🏡" },
  { href: "/todos", label: "To-do", emoji: "☑" },
  { href: "/bucket-list", label: "Bucket list", emoji: "🪣" },
  { href: "/memories", label: "Memories", emoji: "📸" },
  { href: "/plans", label: "Calendar", emoji: "🗓" },
  { href: "/notes", label: "Notes", emoji: "💌" },
  { href: "/gallery", label: "Gallery", emoji: "🖼" },
  { href: "/timeline", label: "Timeline", emoji: "📅" },
  { href: "/places", label: "Places", emoji: "📍" },
  { href: "/us", label: "Us", emoji: "❤️" },
];

// Bottom nav on mobile only has room for a handful of icons; the rest live behind "More".
export const BOTTOM_NAV_PRIMARY = ["/", "/todos", "/plans", "/memories"];
