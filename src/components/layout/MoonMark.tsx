export default function MoonMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M15.5 3.5c-4.8.7-8 4.9-7.5 9.7.5 4.8 4.9 8.2 9.7 7.5-2.6 2.1-6.1 3-9.6 2.1C2.6 21.3-.9 15.5.9 10 2.4 5.4 6.9 2.6 11.6 3c1.4.1 2.7.5 3.9 1.1a9.9 9.9 0 0 0-.02-.6z"
        fill="currentColor"
      />
      <circle cx="19" cy="5" r="0.9" fill="currentColor" opacity="0.7" />
      <circle cx="21.5" cy="9" r="0.5" fill="currentColor" opacity="0.5" />
    </svg>
  );
}
