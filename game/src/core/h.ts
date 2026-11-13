// Tiny DOM builder: h('div', { class: 'x', onclick: fn, 'data-testid': 'y' }, child, 'text', [more]).
export type Child = Node | string | number | null | undefined | false | Child[];
export type Props = Record<string, unknown> & { class?: string; style?: string | Partial<CSSStyleDeclaration> };

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, props?: Props | null, ...children: Child[]): HTMLElementTagNameMap[K];
export function h(tag: string, props?: Props | null, ...children: Child[]): HTMLElement;
export function h(tag: string, props?: Props | null, ...children: Child[]): HTMLElement {
  const el = document.createElement(tag);
  if (props) setProps(el, props);
  append(el, children);
  return el;
}

export function setProps(el: Element, props: Props): void {
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') el.setAttribute('class', String(v));
    else if (k === 'style' && typeof v === 'object') Object.assign((el as HTMLElement).style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v as EventListener);
    else if (k === 'html') el.innerHTML = String(v);
    else if (k in el && !k.includes('-') && k !== 'list' && k !== 'form') (el as unknown as Record<string, unknown>)[k] = v;
    else el.setAttribute(k, v === true ? '' : String(v));
  }
}

export function append(el: Node, children: Child[]): void {
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    if (Array.isArray(c)) append(el, c);
    else el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
  }
}

const SVGNS = 'http://www.w3.org/2000/svg';
/** SVG from markup (art is authored as strings; ids are prefixed per instance so gradients do not clash). */
let svgSeq = 0;
export function svg(markup: string, cls = ''): SVGSVGElement {
  const pre = 'g' + (++svgSeq) + '_';
  const m = markup.replace(/\bid="([^"]+)"/g, `id="${pre}$1"`).replace(/url\(#([^)]+)\)/g, `url(#${pre}$1)`).replace(/href="#([^"]+)"/g, `href="#${pre}$1"`);
  const tpl = document.createElementNS(SVGNS, 'svg');
  tpl.innerHTML = m;
  const inner = tpl.firstElementChild as SVGSVGElement | null;
  const el = inner && inner.tagName.toLowerCase() === 'svg' ? inner : tpl;
  if (cls) el.setAttribute('class', (el.getAttribute('class') || '') + ' ' + cls);
  el.setAttribute('aria-hidden', 'true');
  el.setAttribute('focusable', 'false');
  return el as SVGSVGElement;
}

export const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector(sel) as T | null;
export const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => [...root.querySelectorAll(sel)] as T[];
export function clear(el: Element): void { while (el.firstChild) el.removeChild(el.firstChild); }
