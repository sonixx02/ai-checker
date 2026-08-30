import { Bell, ChevronDown, CircleHelp, ClipboardList, Settings } from "lucide-react";

export default function TopBar({ onOpenSettings }: { onOpenSettings: () => void }) {
  return (
    <header className="flex items-center justify-between border-b border-line bg-white px-4 py-2.5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button
          type="button"
          aria-label="Back"
          className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-surface"
        >
          <span aria-hidden className="text-base leading-none">&#8592;</span>
        </button>
        <ClipboardList className="h-4 w-4" />
        <span>Exams</span>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Help"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface"
        >
          <CircleHelp className="h-4 w-4" />
        </button>

        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-brand" />
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          title="Settings"
          aria-label="Settings"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface hover:text-ink"
        >
          <Settings className="h-4 w-4" />
        </button>

        <div className="ml-1 flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-surface">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand">
            DT
          </span>
          <span className="hidden text-sm text-ink sm:inline">Demo Teacher</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>
    </header>
  );
}
