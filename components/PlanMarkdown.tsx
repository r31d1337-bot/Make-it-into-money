"use client";

import { useCallback, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { hashText, taskKey } from "@/lib/tasks";

type Props = {
  children: string;
  /**
   * If provided, GFM task-list checkboxes become interactive and persist their
   * checked state to localStorage keyed by (planId, item-content hash).
   * Omit this for streaming/preview content where state doesn't matter.
   */
  planId?: string;
};

/**
 * Renders streamed/stored plan markdown.
 * - External links open in a new tab with an ↗ glyph.
 * - GFM task-list items render as real, interactive, persistent checkboxes.
 */
export default function PlanMarkdown({ children, planId }: Props) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a({ href, children: linkChildren, ...props }) {
          const url = typeof href === "string" ? href : "";
          const isExternal = /^https?:\/\//i.test(url);
          return (
            <a
              href={url}
              {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              {...props}
            >
              {linkChildren}
              {isExternal && (
                <svg
                  aria-hidden
                  className="ml-0.5 inline-block align-baseline"
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M7 17L17 7M7 7h10v10" />
                </svg>
              )}
            </a>
          );
        },
        // react-markdown passes `checked` on li only for task-list items.
        // We replace the default <input> child with our own stateful checkbox.
        li({ className, children: liChildren, ...props }) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const maybeChecked = (props as any).checked as boolean | null | undefined;
          const isTask = maybeChecked === true || maybeChecked === false;
          if (!isTask) {
            return <li className={className}>{liChildren}</li>;
          }
          return (
            <TaskListItem planId={planId} defaultChecked={maybeChecked === true}>
              {liChildren}
            </TaskListItem>
          );
        },
        // GFM renders the task list's parent <ul> with class "contains-task-list".
        // Pass it through so CSS can remove the bullet.
        ul({ className, children: ulChildren, ...props }) {
          return (
            <ul className={className} {...props}>
              {ulChildren}
            </ul>
          );
        },
      }}
    >
      {children}
    </ReactMarkdown>
  );
}

function TaskListItem({
  planId,
  defaultChecked,
  children,
}: {
  planId?: string;
  defaultChecked: boolean;
  children: React.ReactNode;
}) {
  const [checked, setChecked] = useState<boolean>(defaultChecked);
  const [hydrated, setHydrated] = useState(false);

  // Derive storage key from the item's text content so the same task keeps
  // its state across re-renders (even if the model re-streams ordering).
  const textContent = extractText(children).trim();
  const key = planId ? taskKey(planId, hashText(textContent)) : null;

  // Hydrate from localStorage on mount.
  useEffect(() => {
    if (!key) return;
    try {
      const v = localStorage.getItem(key);
      if (v === "1") setChecked(true);
      else if (v === "0") setChecked(false);
    } catch {
      // ignore
    }
    setHydrated(true);
  }, [key]);

  const toggle = useCallback(() => {
    setChecked((prev) => {
      const next = !prev;
      if (key) {
        try {
          localStorage.setItem(key, next ? "1" : "0");
        } catch {
          // quota exceeded — ignore
        }
      }
      return next;
    });
  }, [key]);

  return (
    <li className="task-item group flex list-none items-start gap-2.5 pl-0">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={toggle}
        className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded border transition ${
          checked
            ? "border-purple-500 bg-purple-500/20 text-purple-200"
            : "border-neutral-700 bg-neutral-950 hover:border-neutral-500"
        }`}
      >
        {checked && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>
      <span
        className={`flex-1 transition ${
          hydrated && checked ? "text-neutral-500 line-through decoration-neutral-600" : ""
        }`}
        onClick={toggle}
      >
        {children}
      </span>
    </li>
  );
}

function extractText(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (typeof node === "object" && "props" in node) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return extractText((node as any).props?.children);
  }
  return "";
}
