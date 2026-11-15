export function PlayIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M8.4 5.2c0-1.1 1.2-1.8 2.2-1.2l8.1 5.4c.9.6.9 1.9 0 2.5l-8.1 5.4c-1 .6-2.2-.1-2.2-1.2V5.2Z" />
    </svg>
  );
}

export function PauseIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <rect x="6.4" y="4.6" width="4" height="14.8" rx="1.6" />
      <rect x="13.6" y="4.6" width="4" height="14.8" rx="1.6" />
    </svg>
  );
}

export function VolumeIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M4 9.5h3l4.2-3.4v11.8L7 14.5H4z" />
      <path d="M15.5 9a4.5 4.5 0 0 1 0 6" />
      <path d="M18.3 6.6a8 8 0 0 1 0 10.8" />
    </svg>
  );
}

export function ClockIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.6V12l3 1.9" />
    </svg>
  );
}

export function RadioIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="2.2" />
      <path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4M4.9 4.9a10 10 0 0 0 0 14.2M19.1 4.9a10 10 0 0 1 0 14.2" />
    </svg>
  );
}

export function ArrowIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
}

export function CloseIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className={className} aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function MenuIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className={className} aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function CalendarIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3.5" y="5.5" width="17" height="15" rx="3" />
      <path d="M8 3.5v4M16 3.5v4M3.5 10.5h17" />
    </svg>
  );
}

export function WaveformIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 48 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className={className} aria-hidden="true">
      <path d="M4 12v0M10 8v8M16 4v16M22 9v6M28 2v20M34 7v10M40 10v4M45 12v0" />
    </svg>
  );
}

export function AppleMusicIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.05 12.54c-.03-2.89 2.36-4.28 2.47-4.35-1.35-1.97-3.44-2.24-4.18-2.27-1.78-.18-3.47 1.05-4.37 1.05-.9 0-2.29-1.02-3.77-1-1.94.03-3.72 1.13-4.72 2.86-2.01 3.49-.51 8.66 1.45 11.5.96 1.39 2.11 2.95 3.61 2.9 1.45-.06 2-.94 3.75-.94 1.75 0 2.24.94 3.77.91 1.56-.03 2.54-1.41 3.49-2.81 1.1-1.61 1.55-3.17 1.58-3.25-.04-.02-3.05-1.17-3.08-4.6zM14.16 4.05c.79-.96 1.33-2.29 1.18-3.62-1.14.05-2.53.76-3.35 1.72-.73.85-1.38 2.21-1.21 3.51 1.28.1 2.58-.65 3.38-1.61z" />
    </svg>
  );
}

export function GoogleIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81z" />
    </svg>
  );
}
