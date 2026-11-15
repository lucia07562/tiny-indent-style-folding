# tiny-indent-style-folding

Parses indentation-structured text into a nested tree of nodes, treating leading whitespace as hierarchy.

## Usage

```js
import { parseIndentTree, flattenTree, serializeTree } from './src/index.js';

const text = `root
  child1
    grandchild
  child2
sibling`;

const tree = parseIndentTree(text);
console.log(tree[0].text); // "root"
console.log(tree[0].children[0].text); // "child1"

const flat = flattenTree(tree);
console.log(flat.map((n) => n.text)); // ["root", "child1", "grandchild", "child2", "sibling"]

const output = serializeTree(tree);
console.log(output); // same as input (with two-space indentation)
```

## Why this exists

Many text formats (YAML, Python, Makefiles) use indentation as structure, but parsing that structure is usually entangled with a full parser. This library isolates the indentation-folding step: it turns any block of text into a tree where each node knows its original indentation level and its children. The trade-off is strictness: we require a single indentation unit (all spaces or all tabs) and reject mixed or inconsistent indentation. That keeps the tree unambiguous and the code small. If you need to accept messy real-world input, you should normalize it before calling `parseIndentTree`.

## Edge cases

- Blank lines and lines containing only whitespace are ignored.
- Trailing whitespace on a line is trimmed before storing `text`.
- Indentation must be uniform: mixing spaces and tabs throws `IndentParseError`.
- A child must be indented strictly more than its parent; an indentation that is greater than the parent but not a multiple of the detected unit is still accepted as long as it is consistent with the unit character. The tree simply records the raw indentation count.
- The parser does not require a fixed indent step; any positive increase works.

## API

### `parseIndentTree(text: string): IndentNode[]`

Returns the top-level nodes. Throws `IndentParseError` on invalid indentation, or `TypeError` if `text` is not a string.

### `parseIndentText(text: string): IndentNode[]`

Alias for `parseIndentTree`.

### `flattenTree(nodes: IndentNode[]): IndentNode[]`

Returns a flat array of nodes in depth-first order.

### `serializeTree(nodes: IndentNode[], indentSize = 2): string`

Serializes a tree back to text. `indentSize` must be a positive integer.

### `IndentParseError`

Error subclass thrown on indentation problems. Has a `line` property (1-based) when available.

### `IndentNode`

```ts
type IndentNode = {
  text: string;
  indent: number;
  children: IndentNode[];
};
```
