"use client";

import {
  BookMarked,
  ClipboardList,
  GraduationCap,
  LayoutGrid,
  Library,
  PanelLeft,
  PanelLeftClose,
  Bot,
  Settings,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Home", icon: LayoutGrid, active: false },
  { label: "My Classroom", icon: GraduationCap, active: false },
  { label: "Assignments", icon: ClipboardList, active: false },
  { label: "Exams", icon: BookMarked, active: true },
  { label: "My Library", icon: Library, active: false },
];

function SchoolCrest() {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-white text-[10px] font-bold text-good">
      DPS
    </span>
  );
}

type Props = {
  collapsed: boolean;
  onToggle: () => void;
  onOpenSettings: () => void;
};

function CollapsedRail({ onToggle, onOpenSettings, extraClass }: Props & { extraClass: string }) {
  return (
    <aside
      className={`hidden w-14 shrink-0 flex-col items-center border-r border-line bg-white py-3 md:flex ${extraClass}`}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-sm font-bold text-white">
        V
      </span>

      <button
        type="button"
        onClick={onToggle}
        title="Expand sidebar"
        aria-label="Expand sidebar"
        className="mt-2 hidden h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface hover:text-ink xl:flex"
      >
        <PanelLeft className="h-4 w-4" />
      </button>

      <span className="my-3 h-px w-7 bg-line" />

      <button
        type="button"
        title="AI Teacher's Toolkit"
        aria-label="AI Teacher's Toolkit"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-ring bg-ink text-brand"
      >
        <Bot className="h-4 w-4" />
      </button>

      <nav className="mt-4 flex flex-1 flex-col items-center gap-1">
        {NAV_ITEMS.map((item) => (
          <span
            key={item.label}
            title={item.label}
            className={`flex h-9 w-9 items-center justify-center rounded-lg ${
              item.active
                ? "bg-brand-soft text-brand"
                : "text-muted-foreground hover:bg-surface"
            }`}
          >
            <item.icon className="h-4 w-4" />
          </span>
        ))}
      </nav>

      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={onOpenSettings}
          title="Settings"
          aria-label="Settings"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface hover:text-ink"
        >
          <Settings className="h-4 w-4" />
        </button>
        <SchoolCrest />
      </div>
    </aside>
  );
}

function FullSidebar({ onToggle, onOpenSettings }: Props) {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-white px-3 py-3 xl:flex">
      <div className="mb-4 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-sm font-bold text-white">
            V
          </span>
          <span className="text-base font-semibold tracking-tight">VedaAI</span>
        </div>
        <button
          type="button"
          onClick={onToggle}
          title="Collapse sidebar"
          aria-label="Collapse sidebar"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface hover:text-ink"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      <button
        type="button"
        className="mb-5 flex w-full items-center justify-center gap-2 rounded-full border border-brand-ring bg-ink px-3 py-2.5 text-sm font-medium text-white"
      >
        <Bot className="h-4 w-4 text-brand" />
        AI Teacher&rsquo;s Toolkit
      </button>

      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => (
          <div
            key={item.label}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
              item.active
                ? "bg-brand-soft font-medium text-brand"
                : "text-muted-foreground"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </div>
        ))}
      </nav>

      <div className="space-y-2">
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-surface hover:text-ink"
        >
          <Settings className="h-4 w-4" />
          Settings
        </button>
        <div className="flex items-center gap-2.5 rounded-xl border border-line px-3 py-2.5">
          <SchoolCrest />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Delhi Public School</p>
            <p className="truncate text-xs text-muted-foreground">Bokaro Steel City</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default function Sidebar(props: Props) {
  if (props.collapsed) {
    return <CollapsedRail {...props} extraClass="" />;
  }

  return (
    <>
      <CollapsedRail {...props} extraClass="xl:hidden" />
      <FullSidebar {...props} />
    </>
  );
}
