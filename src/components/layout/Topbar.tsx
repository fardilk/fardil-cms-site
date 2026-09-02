import ImageWithFallback from '../atoms/ImageWithFallback';

type Props = {
  onLogout: () => void;
  /** Shown in the account chip; the avatar falls back to these initials. */
  userName?: string;
};

/**
 * Full-width dark bar pinned above both the navigation and the content, the way
 * Shopify's admin frames the whole application rather than just the main column.
 */
const Topbar = ({ onLogout, userName = 'Admin' }: Props) => (
  <header className="flex h-14 shrink-0 items-center gap-4 bg-[var(--p-topbar)] px-3">
    <div className="flex w-56 shrink-0 items-center gap-2 text-white">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/10">
        <i className="fa fa-cubes text-sm" aria-hidden="true" />
      </span>
      <span className="hidden text-sm font-semibold sm:inline">Excellence Plus</span>
    </div>

    <div className="flex min-w-0 flex-1 justify-center">
      <label className="sr-only" htmlFor="global-search">
        Cari
      </label>
      <div className="relative w-full max-w-xl">
        <i
          className="fa fa-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/50"
          aria-hidden="true"
        />
        <input
          id="global-search"
          type="search"
          placeholder="Cari"
          className="w-full rounded-lg border border-white/15 bg-white/10 py-1.5 pl-8 pr-3 text-[0.8125rem] text-white placeholder:text-white/50 focus:border-white/40 focus:outline-none"
        />
      </div>
    </div>

    <div className="flex w-56 shrink-0 items-center justify-end gap-1">
      <button
        type="button"
        aria-label="Notifikasi"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-white/80 hover:bg-white/10"
      >
        <i className="fa fa-bell text-sm" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onLogout}
        className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 text-white/90 hover:bg-white/10"
        title="Keluar"
      >
        <ImageWithFallback
          src={`${import.meta.env.BASE_URL}profile.png`}
          alt=""
          icon="fa-user"
          className="h-6 w-6 rounded-md object-cover"
          iconClassName="text-[10px]"
        />
        <span className="hidden text-[0.8125rem] sm:inline">{userName}</span>
        <i className="fa fa-arrow-right-from-bracket text-xs opacity-70" aria-hidden="true" />
      </button>
    </div>
  </header>
);

export default Topbar;
