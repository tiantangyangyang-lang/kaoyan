import katex from "katex";
import type { ReactNode } from "react";

const mathPattern = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;

export function MathText({ children }: { children: string }): ReactNode {
  const parts = children.split(mathPattern).filter(Boolean);

  return parts.map((part, index) => {
    const isBlock = part.startsWith("$$") && part.endsWith("$$");
    const isInline = !isBlock && part.startsWith("$") && part.endsWith("$");

    if (!isBlock && !isInline) {
      return <span key={index}>{part}</span>;
    }

    const expression = part.slice(isBlock ? 2 : 1, isBlock ? -2 : -1);
    try {
      const html = katex.renderToString(expression, {
        displayMode: isBlock,
        throwOnError: false,
        strict: false,
        trust: false,
      });
      return isBlock ? (
        <div
          className="math-block"
          dangerouslySetInnerHTML={{ __html: html }}
          key={index}
        />
      ) : (
        <span
          className="math-inline"
          dangerouslySetInnerHTML={{ __html: html }}
          key={index}
        />
      );
    } catch {
      return <code key={index}>{part}</code>;
    }
  });
}
