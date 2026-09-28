// The words a script can put on a page: every string and template literal in a JavaScript source, without its comments.
//
// A small tokenizer, not a parser - enough to tell `'the family loses glory'` (words a student reads) from `world.glory` (a
// name in code) and from `// glory is hidden` (a note to the next builder). It knows strings, template literals with their
// `${...}` holes, line and block comments, and regular-expression literals by the usual rule: a `/` where a value may start
// begins a regular expression, and a `/` after a value divides.
// ceiling: a `/` after `)` is read as division, so a regular expression straight after an `if (...)` or `while (...)` would be
// read as code; none of the sources scanned writes one, and a parser (acorn) would be the way out if one ever does.

const VALUE_ENDS = /[\w$)\]}'"`]/;
const KEYWORDS_BEFORE_VALUE = /(?:^|[^\w$])(?:return|typeof|instanceof|in|of|new|delete|void|throw|case|do|else|yield|await)$/;

/** Every string in `source`, as `{ text, line }`; a template literal's text is joined around its holes. */
export function stringsOf(source) {
  const out = [];
  let i = 0, line = 1;
  const stack = []; // template literals whose `${` hole we are inside, by brace depth
  let depth = 0;
  let lastSignificant = '';
  let recent = '';
  const push = (text, at) => out.push({ text, line: at });
  const readTemplate = () => {
    // i is just past a backtick or a closing `}` of a hole
    let text = '', at = line;
    while (i < source.length) {
      const c = source[i];
      if (c === '\\') { text += source.slice(i, i + 2); if (source[i + 1] === '\n') line++; i += 2; continue; }
      if (c === '`') { i++; push(text, at); lastSignificant = '`'; return; }
      if (c === '$' && source[i + 1] === '{') { i += 2; push(text, at); stack.push(depth); depth++; lastSignificant = '{'; return; }
      if (c === '\n') line++;
      text += c; i++;
    }
  };
  while (i < source.length) {
    const c = source[i], next = source[i + 1];
    if (c === '\n') { line++; i++; continue; }
    if (/\s/.test(c)) { i++; continue; }
    if (c === '/' && next === '/') { while (i < source.length && source[i] !== '\n') i++; continue; }
    if (c === '/' && next === '*') { const end = source.indexOf('*/', i + 2); const stop = end < 0 ? source.length : end + 2; line += (source.slice(i, stop).match(/\n/g) || []).length; i = stop; continue; }
    if (c === '"' || c === "'") {
      let text = '', at = line; i++;
      while (i < source.length && source[i] !== c && source[i] !== '\n') { if (source[i] === '\\') { text += source.slice(i, i + 2); i += 2; continue; } text += source[i]; i++; }
      i++; push(text, at); lastSignificant = c; recent = ''; continue;
    }
    if (c === '`') { i++; readTemplate(); recent = ''; continue; }
    if (c === '/') {
      const valueBefore = VALUE_ENDS.test(lastSignificant) && !KEYWORDS_BEFORE_VALUE.test(recent);
      if (!valueBefore) {
        // A regular expression: skip it, with its character classes, and its flags.
        i++; let inClass = false;
        while (i < source.length && source[i] !== '\n') {
          const r = source[i];
          if (r === '\\') { i += 2; continue; }
          if (r === '[') inClass = true; else if (r === ']') inClass = false; else if (r === '/' && !inClass) break;
          i++;
        }
        i++; while (/[a-z]/i.test(source[i] || '')) i++;
        lastSignificant = ')'; recent = ''; continue;
      }
    }
    if (c === '{') depth++;
    if (c === '}') {
      if (stack.length && stack.at(-1) === depth - 1) { depth--; stack.pop(); i++; readTemplate(); recent = ''; continue; }
      depth--;
    }
    lastSignificant = c;
    recent = /[\w$]/.test(c) ? recent + c : '';
    i++;
  }
  return out;
}
