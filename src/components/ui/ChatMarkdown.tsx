import React from "react";

function renderInline(text: string, keyPrefix: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${keyPrefix}-${i}`} className="font-semibold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export function ChatMarkdown({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Headings
    if (line.startsWith("## ")) {
      elements.push(
        <p key={i} className="mt-3 mb-1 text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
          {renderInline(line.slice(3), `h-${i}`)}
        </p>
      );
      i++;
      continue;
    }

    // Numbered list items
    if (/^\d+\.\s/.test(line)) {
      const listItems: { num: string; text: string; idx: number }[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        const match = lines[i].match(/^(\d+)\.\s(.*)$/);
        if (match) listItems.push({ num: match[1], text: match[2], idx: i });
        i++;
      }
      elements.push(
        <ol key={`ol-${listItems[0].idx}`} className="mt-1.5 space-y-1">
          {listItems.map((item) => (
            <li key={item.idx} className="flex gap-2">
              <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
                {item.num}
              </span>
              <span className="flex-1">{renderInline(item.text, `li-${item.idx}`)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Bullet list items
    if (line.startsWith("- ") || line.startsWith("• ")) {
      const listItems: { text: string; idx: number }[] = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("• "))) {
        listItems.push({ text: lines[i].slice(2), idx: i });
        i++;
      }
      elements.push(
        <ul key={`ul-${listItems[0].idx}`} className="mt-1.5 space-y-1">
          {listItems.map((item) => (
            <li key={item.idx} className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400 dark:bg-violet-500" />
              <span className="flex-1">{renderInline(item.text, `li-${item.idx}`)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Horizontal rule
    if (line.trim() === "---") {
      elements.push(<hr key={i} className="my-2 border-slate-200 dark:border-dark-600" />);
      i++;
      continue;
    }

    // Empty line = paragraph break
    if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i}>{renderInline(line, `p-${i}`)}</p>
    );
    i++;
  }

  return <div className="space-y-0.5">{elements}</div>;
}
