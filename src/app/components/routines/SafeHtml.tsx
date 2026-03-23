"use client";

import DOMPurify from "dompurify";

interface SafeHtmlProps {
  html: string;
  className?: string;
}

export function SafeHtml({ html, className }: SafeHtmlProps) {
  const safeHtml = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p",
      "ul",
      "ol",
      "li",
      "strong",
      "b",
      "em",
      "i",
      "br",
      "span",
    ],
    ALLOWED_ATTR: [],
  });

  return (
    <div className={className} dangerouslySetInnerHTML={{ __html: safeHtml }} />
  );
}
