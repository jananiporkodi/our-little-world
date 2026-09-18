export type ReactionType = "kiss" | "hug" | "miss_you" | "high_five";

/** The little instant nudges on the floating reaction dock - no typing required, just a tap. */
export const REACTION_TYPES: {
  key: ReactionType;
  emoji: string;
  label: string;
  notifyTitle: (actorName: string) => string;
  notifyBody: string;
}[] = [
  { key: "kiss", emoji: "💋", label: "Kiss", notifyTitle: (n) => `${n} sent you a kiss 💋`, notifyBody: "Thinking of you." },
  { key: "hug", emoji: "🤗", label: "Hug", notifyTitle: (n) => `${n} sent you a hug 🤗`, notifyBody: "Sending you a big hug." },
  { key: "miss_you", emoji: "🥺", label: "Miss you", notifyTitle: (n) => `${n} misses you 🥺`, notifyBody: "Can't wait to see you." },
  { key: "high_five", emoji: "🙌", label: "High five", notifyTitle: (n) => `${n} sent a high five 🙌`, notifyBody: "You're crushing it." },
];
