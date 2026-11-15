import { AVATAR_OPTIONS } from '../game/types';

interface AvatarIconProps {
  avatarId: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AvatarIcon({ avatarId, size = 'md' }: AvatarIconProps) {
  const option =
    AVATAR_OPTIONS.find((a) => a.id === avatarId) ?? AVATAR_OPTIONS[0];

  const dims =
    size === 'sm' ? 'w-9 h-9' : size === 'lg' ? 'w-16 h-16' : 'w-11 h-11';
  const iconDims =
    size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-9 h-9' : 'w-6 h-6';

  return (
    <div
      className={`${dims} rounded-xl flex items-center justify-center shrink-0 border border-white/15`}
      style={{ backgroundColor: `${option.accent}1E` }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke={option.accent}
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={iconDims}
      >
        {avatarId === 'ace' && (
          <>
            <path d="M12 3c-3 4-7 7-7 11a4 4 0 0 0 7 2.5A4 4 0 0 0 19 14c0-4-4-7-7-11z" />
            <path d="M12 16v5" />
            <path d="M9 21h6" />
          </>
        )}
        {avatarId === 'chai' && (
          <>
            <path d="M5 9h11v6a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5V9z" />
            <path d="M16 10h2a2.5 2.5 0 0 1 0 5h-2" />
            <path d="M8 4c0 1.5 1 2 1 3" />
            <path d="M12 4c0 1.5 1 2 1 3" />
          </>
        )}
        {avatarId === 'crown' && (
          <>
            <path d="M3 18h18l-1.5-10-4.5 4-3-6-3 6-4.5-4L3 18z" />
            <path d="M5 20h14" />
          </>
        )}
        {avatarId === 'falcon' && (
          <>
            <path d="M4 17c4-8 10-12 16-12-2 4-5 7-9 8l3 4-5-1-5 1z" />
          </>
        )}
        {avatarId === 'lotus' && (
          <>
            <path d="M12 3l6 9-6 9-6-9 6-9z" />
            <path d="M12 8v8" />
          </>
        )}
        {avatarId === 'owl' && (
          <>
            <path d="M6 7l3 2h6l3-2v7a6 6 0 0 1-12 0V7z" />
            <circle cx="9.5" cy="12.5" r="1.5" />
            <circle cx="14.5" cy="12.5" r="1.5" />
          </>
        )}
        {avatarId === 'tigers' && (
          <>
            <path d="M5 8l3-3 4 2 4-2 3 3v6a7 7 0 0 1-14 0V8z" />
            <path d="M9 13h6" />
          </>
        )}
        {avatarId === 'joker' && (
          <>
            <rect x="5" y="4" width="14" height="16" rx="2" />
            <circle cx="12" cy="12" r="2.5" />
          </>
        )}
      </svg>
    </div>
  );
}

interface AvatarPickerProps {
  value: string;
  onChange: (id: string) => void;
}

export function AvatarPicker({ value, onChange }: AvatarPickerProps) {
  return (
    <div
      className="grid grid-cols-4 gap-2"
      role="radiogroup"
      aria-label="Choose avatar"
    >
      {AVATAR_OPTIONS.map((avatar) => {
        const selected = value === avatar.id;
        return (
          <button
            key={avatar.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(avatar.id)}
            className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all cursor-pointer ${
              selected
                ? 'bg-amber-500/15 border-amber-400 text-white'
                : 'bg-white/[0.03] border-white/10 text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'
            }`}
          >
            <AvatarIcon avatarId={avatar.id} size="sm" />
            <span className="text-[11px] font-medium whitespace-nowrap truncate max-w-full">
              {avatar.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
