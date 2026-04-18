import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renders streamed/stored plan markdown with safe, consistent link behavior:
 * external links open in a new tab, with noopener/noreferrer, and get an
 * external-link glyph so they're visibly clickable.
 */
export default function PlanMarkdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a({ href, children, ...props }) {
          const url = typeof href === "string" ? href : "";
          const isExternal = /^https?:\/\//i.test(url);
          return (
            <a
              href={url}
              {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              {...props}
            >
              {children}
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
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
