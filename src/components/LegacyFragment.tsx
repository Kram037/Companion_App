import { createElement, type CSSProperties, type ReactNode } from 'react';

const ALLOWED_TAGS = new Set([
  'article', 'button', 'col', 'colgroup', 'details', 'div', 'em', 'h2', 'h3', 'h4', 'header', 'i', 'img',
  'li', 'ol', 'p', 'section', 'small', 'span', 'strong', 'summary', 'table', 'tbody', 'td', 'th', 'thead', 'tr', 'ul', 'br',
]);

export function LegacyFragment({ content, onAction }: { content: string; onAction?: () => void }) {
  if (!content) return null;
  const document = new DOMParser().parseFromString(`<div>${content}</div>`, 'text/html');
  return <>{Array.from(document.body.firstElementChild?.childNodes ?? []).map((node, index) => convertNode(node, index, onAction))}</>;
}

function convertNode(node: Node, key: number, onAction?: () => void): ReactNode {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent;
  if (!(node instanceof Element)) return null;
  const tag = node.tagName.toLowerCase();
  const children = Array.from(node.childNodes).map((child, index) => convertNode(child, index, onAction));
  if (!ALLOWED_TAGS.has(tag)) return children;

  const props: Record<string, unknown> = { key };
  for (const attribute of Array.from(node.attributes)) {
    const name = attribute.name.toLowerCase();
    if (name === 'class') props.className = attribute.value;
    else if (name === 'style') props.style = parseStyle(attribute.value);
    else if (name === 'colspan') props.colSpan = Number(attribute.value);
    else if (name === 'rowspan') props.rowSpan = Number(attribute.value);
    else if (name === 'open' || name === 'disabled') props[name] = true;
    else if (name.startsWith('aria-') || name.startsWith('data-') || ['alt', 'src', 'title', 'type', 'loading'].includes(name)) props[name] = attribute.value;
    else if (name === 'onclick') props.onClick = () => runLegacyAction(attribute.value, onAction);
  }
  return createElement(tag, props, ...children);
}

function parseStyle(value: string): CSSProperties {
  return Object.fromEntries(value.split(';').map(rule => rule.split(':').map(part => part.trim())).filter(parts => parts.length === 2)
    .map(([key, styleValue]) => [key.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase()), styleValue])) as CSSProperties;
}

async function runLegacyAction(code: string, onAction?: () => void) {
  const match = code.trim().match(/^([A-Za-z][\w]*)\((.*)\)$/);
  if (!match || !match[1].startsWith('compendio')) return;
  const fn = (window as unknown as Record<string, unknown>)[match[1]];
  if (typeof fn !== 'function') return;
  const args = [...match[2].matchAll(/'((?:\\'|[^'])*)'/g)].map(entry => entry[1].replaceAll("\\'", "'"));
  await (fn as (...values: string[]) => unknown)(...args);
  onAction?.();
}
