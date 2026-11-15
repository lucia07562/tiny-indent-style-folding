/**
 * Parses indentation-structured text into a nested tree of nodes.
 *
 * Leading whitespace is interpreted as hierarchy. The parser is deliberately
 * strict: indentation must use a single consistent unit (all spaces or all
 * tabs) and a child's indentation must be strictly greater than its parent's.
 * This avoids the ambiguity that arises when mixed indentation is allowed.
 */

/**
 * @typedef {Object} IndentNode
 * @property {string} text - The trimmed text content of the line.
 * @property {number} indent - The number of leading whitespace characters.
 * @property {IndentNode[]} children - Nested child nodes.
 */

/**
 * Thrown when the input violates the indentation rules.
 */
export class IndentParseError extends Error {
  /**
   * @param {string} message
   * @param {number} [line] - 1-based line number where the error occurred.
   */
  constructor(message, line) {
    super(line == null ? message : `${message} (line ${line})`);
    this.name = 'IndentParseError';
    this.line = line;
  }
}

/**
 * Detects the indentation unit from the first indented line.
 * We require a single unit type (spaces or tabs) and reject mixed usage.
 *
 * @param {string} text
 * @returns {' ' | '\t' | null} The indent character, or null if no indentation found.
 */
function detectIndentUnit(text) {
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    if (line.length === 0) continue;
    const match = line.match(/^(\s+)/);
    if (!match) continue;
    const ws = match[1];
    const hasSpace = ws.includes(' ');
    const hasTab = ws.includes('\t');
    if (hasSpace && hasTab) {
      throw new IndentParseError('Mixed spaces and tabs in indentation');
    }
    return hasTab ? '\t' : ' ';
  }
  return null;
}

/**
 * Counts leading whitespace characters, validating that they match the unit.
 *
 * @param {string} line
 * @param {' ' | '\t' | null} unit
 * @param {number} lineNumber - 1-based line number for error reporting.
 * @returns {number}
 */
function countIndent(line, unit, lineNumber) {
  let count = 0;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === ' ' || ch === '\t') {
      if (unit && ch !== unit) {
        throw new IndentParseError(
          `Inconsistent indentation character: expected ${unit === '\t' ? 'tab' : 'space'}`,
          lineNumber
        );
      }
      count++;
    } else {
      break;
    }
  }
  return count;
}

/**
 * Parses indentation-structured text into a nested tree of nodes.
 *
 * @param {string} text
 * @returns {IndentNode[]} The top-level nodes.
 * @throws {IndentParseError} If indentation is inconsistent or invalid.
 */
export function parseIndentTree(text) {
  if (typeof text !== 'string') {
    throw new TypeError('text must be a string');
  }
  const lines = text.split(/\r?\n/);
  const unit = detectIndentUnit(text);
  const root = { text: '', indent: -1, children: [] };
  const stack = [root];

  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    const raw = lines[i];
    if (raw.trim().length === 0) continue;

    const indent = countIndent(raw, unit, lineNumber);
    const content = raw.slice(indent).trimEnd();
    if (content.length === 0) continue;

    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    const parent = stack[stack.length - 1];
    if (parent !== root && indent <= parent.indent) {
      throw new IndentParseError('Invalid indentation', lineNumber);
    }

    const node = { text: content, indent, children: [] };
    parent.children.push(node);
    stack.push(node);
  }

  return root.children;
}

/**
 * Flattens a tree back into an array of nodes in depth-first order.
 *
 * @param {IndentNode[]} nodes
 * @returns {IndentNode[]}
 */
export function flattenTree(nodes) {
  const result = [];
  const stack = [...nodes].reverse();
  while (stack.length > 0) {
    const node = stack.pop();
    result.push(node);
    for (let i = node.children.length - 1; i >= 0; i--) {
      stack.push(node.children[i]);
    }
  }
  return result;
}

/**
 * Serializes a tree back into indentation-structured text.
 * Uses two spaces per level by default.
 *
 * @param {IndentNode[]} nodes
 * @param {number} [indentSize=2]
 * @returns {string}
 */
export function serializeTree(nodes, indentSize = 2) {
  if (!Number.isInteger(indentSize) || indentSize < 1) {
    throw new RangeError('indentSize must be a positive integer');
  }
  const lines = [];
  const walk = (list, depth) => {
    for (const node of list) {
      lines.push(' '.repeat(depth * indentSize) + node.text);
      walk(node.children, depth + 1);
    }
  };
  walk(nodes, 0);
  return lines.join('\n');
}

/**
 * Convenience alias for parseIndentTree.
 *
 * @param {string} text
 * @returns {IndentNode[]}
 */
export function parseIndentText(text) {
  return parseIndentTree(text);
}
