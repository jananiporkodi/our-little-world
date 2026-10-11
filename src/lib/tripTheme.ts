import type { Trip } from "./types";

export interface TripTheme {
  key: string;
  label: string;
  emoji: string;
  /** Soft, light gradient so dark text stays readable on top of it. */
  gradient: string;
  /** Little icons that float in place across the page background. */
  icons: string[];
}

export const TRIP_THEMES: Record<string, TripTheme> = {
  beach: {
    key: "beach",
    label: "Beach & islands",
    emoji: "🏖",
    gradient: "linear-gradient(135deg, #cdeffd 0%, #fff1c9 100%)",
    icons: ["🌴", "🌊", "🐚", "☀️", "⛱️", "🦀", "🐠", "🍹"],
  },
  mountains: {
    key: "mountains",
    label: "Mountains & hills",
    emoji: "🏔",
    gradient: "linear-gradient(135deg, #d6e8ff 0%, #e4f4e1 100%)",
    icons: ["🏔️", "🌲", "❄️", "⛺", "🌄", "🦌", "🧣", "☕"],
  },
  desert: {
    key: "desert",
    label: "Desert & dunes",
    emoji: "🏜",
    gradient: "linear-gradient(135deg, #ffe3b8 0%, #ffc9a3 100%)",
    icons: ["🐪", "🌵", "☀️", "🏜️", "🌅", "⭐", "🧭", "🏕️"],
  },
  city: {
    key: "city",
    label: "City lights",
    emoji: "🏙",
    gradient: "linear-gradient(135deg, #e1d6ff 0%, #ffd1e1 100%)",
    icons: ["🏙️", "🚕", "🌆", "🌃", "🚆", "🌊", "🎬", "🍛"],
  },
  forest: {
    key: "forest",
    label: "Forest & wildlife",
    emoji: "🌿",
    gradient: "linear-gradient(135deg, #d2f0d6 0%, #f1f7c8 100%)",
    icons: ["🌿", "🦜", "🌳", "🦋", "🐘", "🍃", "🐅", "🌺"],
  },
  heritage: {
    key: "heritage",
    label: "Heritage & culture",
    emoji: "🏛",
    gradient: "linear-gradient(135deg, #ffe4cf 0%, #f6d6e3 100%)",
    icons: ["🏛️", "🕌", "🛕", "🏰", "🪔", "🎨", "📿", "🏺"],
  },
  backwaters: {
    key: "backwaters",
    label: "Backwaters & greens",
    emoji: "🛶",
    gradient: "linear-gradient(135deg, #cdeee4 0%, #e6f5d5 100%)",
    icons: ["🛶", "🌴", "🥥", "🐟", "🌾", "🦆", "🍃", "🌅"],
  },
  japan: {
    key: "japan",
    label: "Japan & sakura",
    emoji: "🌸",
    gradient: "linear-gradient(135deg, #ffd9e6 0%, #fff0f3 50%, #e6dcff 100%)",
    icons: ["🌸", "🗻", "⛩️", "🍣", "🍜", "🎎", "🚅", "🏮"],
  },
  europe: {
    key: "europe",
    label: "Europe",
    emoji: "🏰",
    gradient: "linear-gradient(135deg, #dfe7ff 0%, #ffe9d6 100%)",
    icons: ["🗼", "🥐", "🏰", "🚂", "🍷", "🎻", "⛲", "🧀"],
  },
  snow: {
    key: "snow",
    label: "Snow & winter",
    emoji: "❄️",
    gradient: "linear-gradient(135deg, #e3f2ff 0%, #f4f8ff 100%)",
    icons: ["❄️", "⛷️", "🏂", "⛄", "🧤", "🎿", "🔥", "☕"],
  },
  default: {
    key: "default",
    label: "Classic",
    emoji: "🧳",
    gradient: "linear-gradient(135deg, #ffd9c2 0%, #ffc9d6 100%)",
    icons: ["🧳", "✈️", "🗺️", "📸", "🧭", "🎒", "🚗", "❤️"],
  },
};

export const THEME_OPTIONS = Object.values(TRIP_THEMES);

// Checked in order; the first theme with a matching word wins.
const KEYWORDS: [string, string[]][] = [
  ["japan", ["japan", "tokyo", "kyoto", "osaka", "hokkaido", "hiroshima", "okinawa", "fuji", "sapporo", "nagoya", "yokohama", "hakone", "nippon"]],
  ["snow", ["snow", "ski", "iceland", "norway", "finland", "lapland", "gulmarg", "winter", "alaska", "canada", "tromso"]],
  ["europe", ["europe", "france", "paris", "italy", "rome", "venice", "florence", "milan", "spain", "barcelona", "madrid", "germany", "berlin", "munich", "amsterdam", "netherlands", "belgium", "prague", "vienna", "austria", "greece", "athens", "santorini", "portugal", "lisbon", "london", "united kingdom", "england", "scotland", "ireland", "dublin", "budapest", "poland", "croatia", "swiss", "switzerland", "zurich", "denmark", "copenhagen", "sweden", "stockholm"]],
  ["backwaters", ["kerala", "alleppey", "alappuzha", "kumarakom", "kochi", "cochin", "backwater"]],
  ["beach", ["goa", "beach", "maldives", "bali", "andaman", "phuket", "pondicherry", "puducherry", "gokarna", "kovalam", "varkala", "lakshadweep", "island", "pattaya", "krabi", "mauritius", "seychelles", "vizag", "visakhapatnam", "alibaug", "diu", "daman", "mahabalipuram", "rameswaram", "kanyakumari", "havelock"]],
  ["mountains", ["manali", "shimla", "ladakh", "leh", "himalaya", "kashmir", "srinagar", "ooty", "munnar", "darjeeling", "kodaikanal", "coorg", "nepal", "switzerland", "spiti", "kasol", "mussoorie", "nainital", "rishikesh", "dharamshala", "mcleodganj", "gangtok", "sikkim", "shillong", "meghalaya", "hill", "mountain", "lonavala", "mahabaleshwar", "araku", "yercaud", "wayanad", "chikmagalur", "kedarnath", "badrinath", "auli", "tawang"]],
  ["desert", ["jaisalmer", "jodhpur", "bikaner", "pushkar", "desert", "rajasthan", "sahara", "kutch", "rann"]],
  ["forest", ["corbett", "kaziranga", "ranthambore", "jungle", "safari", "forest", "sundarbans", "thekkady", "periyar", "bandipur", "nagarhole", "kabini", "tadoba", "pench", "kanha", "gir", "wildlife", "national park"]],
  ["heritage", ["hampi", "agra", "jaipur", "udaipur", "varanasi", "benares", "mysore", "mysuru", "amritsar", "khajuraho", "rome", "istanbul", "fort", "palace", "temple", "madurai", "thanjavur", "lucknow", "orchha", "bodh gaya", "ajanta", "ellora", "hyderabad"]],
  ["city", ["mumbai", "bombay", "delhi", "bangalore", "bengaluru", "chennai", "kolkata", "pune", "new york", "london", "paris", "tokyo", "singapore", "hong kong", "seoul", "bangkok", "dubai", "city", "ahmedabad", "chandigarh", "gurgaon", "noida", "sydney", "los angeles", "san francisco", "toronto"]],
];

/** The visual theme for a trip: the one chosen on the trip if any, otherwise guessed from its destination/title. */
export function resolveTripTheme(trip: Pick<Trip, "destination" | "title"> & { theme?: string | null }): TripTheme {
  if (trip.theme && TRIP_THEMES[trip.theme]) return TRIP_THEMES[trip.theme];
  const text = `${trip.destination ?? ""} ${trip.title ?? ""}`.toLowerCase();
  for (const [key, words] of KEYWORDS) {
    if (words.some((w) => text.includes(w))) return TRIP_THEMES[key];
  }
  return TRIP_THEMES.default;
}
