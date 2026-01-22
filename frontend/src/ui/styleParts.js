// src/ui/styleParts.js
import { TOKENS } from "./themeTokens";
import { cx } from "./cx";

export function makeStyles(theme = "dark") {
  const isDark = theme === "dark";

  return {
    page: cx(
      "h-screen w-full",
      isDark ? "bg-[#111214] text-zinc-100" : "bg-white text-zinc-900"
    ),

    header: cx(
      "flex items-center justify-between px-4 border-b",
      TOKENS.headerH,
      isDark ? "border-zinc-800 bg-[#121316]" : "border-zinc-200 bg-white"
    ),

    grid: "grid h-[calc(100vh-56px)] grid-cols-[320px_1fr] overflow-hidden",

    sidebar: cx(
      "flex h-full flex-col border-r",
      isDark ? "border-zinc-800 bg-[#0b0c0f]" : "border-zinc-200 bg-zinc-50"
    ),

    sidebarSearchWrap: cx(
      "rounded-xl p-2",
      isDark ? "bg-[#0e0f12]" : "bg-white"
    ),

    sidebarSearchRow: cx(
      "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm",
      isDark ? "border border-zinc-800 bg-[#0b0c0f]" : "border border-zinc-300 bg-white"
    ),

    sidebarSearchInput: cx(
      "w-full bg-transparent outline-none text-sm",
      isDark ? "placeholder:text-zinc-600" : "placeholder:text-zinc-500"
    ),

    listItem: (active) =>
      cx(
        "group flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition",
        active
          ? isDark
            ? "bg-zinc-800/70 text-zinc-200"
            : "bg-zinc-200 text-zinc-900"
          : isDark
          ? "text-zinc-400 hover:bg-zinc-800/50"
          : "text-zinc-700 hover:bg-zinc-200"
      ),

    main: isDark
      ? "relative flex h-full flex-col bg-[#0b0c0f]"
      : "relative flex h-full flex-col bg-white",

    bubbleUser: cx(
      TOKENS.bubbleMax,
      "rounded-2xl px-3 py-2 text-sm leading-relaxed shadow bg-emerald-600 text-white"
    ),

    bubbleBot: cx(
      TOKENS.bubbleMax,
      "rounded-2xl px-3 py-2 text-sm leading-relaxed shadow border",
      isDark
        ? "bg-[#0e0f12] text-zinc-200 border-zinc-800"
        : "bg-white text-zinc-900 border-zinc-200"
    ),

    inputBar: cx(
      "sticky bottom-0 z-10 w-full backdrop-blur border-t",
      isDark ? "border-zinc-800 bg-[#0b0c0f]/90" : "border-zinc-200 bg-white/90"
    ),

    inputShell: "mx-auto flex w-full max-w-3xl items-end gap-2 px-3 py-3",

    inputBox: cx(
      "flex flex-1 items-center gap-2 rounded-2xl px-3 py-2",
      TOKENS.inputMinH,
      isDark ? "border border-zinc-700 bg-[#0e0f12]" : "border border-zinc-300 bg-white"
    ),

    inputTextarea: cx(
      "max-h-40 w-full resize-none bg-transparent outline-none",
      isDark ? "text-zinc-200 placeholder:text-zinc-500" : "text-zinc-900 placeholder:text-zinc-500"
    ),

    sendBtn: "grid h-8 w-8 place-items-center rounded-xl bg-emerald-500 text-white shadow hover:bg-emerald-600",
  };
}
