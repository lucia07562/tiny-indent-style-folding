import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseIndentTree,
  parseIndentText,
  flattenTree,
  serializeTree,
  IndentParseError,
} from '../src/index.js';

test('parses a simple nested structure', () => {
  const text = ['root', '  child1', '    grandchild', '  child2', 'sibling'].join('\n');
  const tree = parseIndentTree(text);
  assert.equal(tree.length, 2);
  assert.equal(tree[0].text, 'root');
  assert.equal(tree[0].indent, 0);
  assert.equal(tree[0].children.length, 2);
  assert.equal(tree[0].children[0].text, 'child1');
  assert.equal(tree[0].children[0].indent, 2);
  assert.equal(tree[0].children[0].children.length, 1);
  assert.equal(tree[0].children[0].children[0].text, 'grandchild');
  assert.equal(tree[0].children[0].children[0].indent, 4);
  assert.equal(tree[0].children[1].text, 'child2');
  assert.equal(tree[1].text, 'sibling');
  assert.equal(tree[1].indent, 0);
});

test('handles tabs as indentation unit', () => {
  const text = ['a', '\tb', '\t\tc'].join('\n');
  const tree = parseIndentTree(text);
  assert.equal(tree.length, 1);
  assert.equal(tree[0].children.length, 1);
  assert.equal(tree[0].children[0].text, 'b');
  assert.equal(tree[0].children[0].indent, 1);
  assert.equal(tree[0].children[0].children[0].text, 'c');
  assert.equal(tree[0].children[0].children[0].indent, 2);
});

test('rejects mixed spaces and tabs', () => {
  const text = ['a', ' \tb'].join('\n');
  assert.throws(() => parseIndentTree(text), IndentParseError);
});

test('rejects inconsistent indentation character', () => {
  const text = ['a', '  b', '\tc'].join('\n');
  assert.throws(() => parseIndentTree(text), IndentParseError);
});

test('ignores blank lines and trims trailing whitespace', () => {
  const text = ['a', '', '  b   ', '  ', 'c'].join('\n');
  const tree = parseIndentTree(text);
  assert.equal(tree.length, 2);
  assert.equal(tree[0].text, 'a');
  assert.equal(tree[0].children[0].text, 'b');
  assert.equal(tree[1].text, 'c');
});

test('handles empty input', () => {
  assert.deepEqual(parseIndentTree(''), []);
  assert.deepEqual(parseIndentTree('   \n  \n'), []);
});

test('flattens tree in depth-first order', () => {
  const text = ['a', '  b', '    c', '  d', 'e'].join('\n');
  const tree = parseIndentTree(text);
  const flat = flattenTree(tree);
  assert.deepEqual(
    flat.map((n) => n.text),
    ['a', 'b', 'c', 'd', 'e']
  );
});

test('serializes tree with default and custom indent size', () => {
  const tree = [
    {
      text: 'a',
      indent: 0,
      children: [
        { text: 'b', indent: 2, children: [{ text: 'c', indent: 4, children: [] }] },
      ],
    },
  ];
  assert.equal(serializeTree(tree), 'a\n  b\n    c');
  assert.equal(serializeTree(tree, 4), 'a\n    b\n        c');
});

test('round-trips through serialize and parse', () => {
  const text = ['a', '  b', '    c', '  d', 'e'].join('\n');
  const tree = parseIndentTree(text);
  const serialized = serializeTree(tree);
  const reparsed = parseIndentTree(serialized);
  assert.deepEqual(reparsed, tree);
});

test('parseIndentText is an alias for parseIndentTree', () => {
  const text = ['a', '  b'].join('\n');
  assert.deepEqual(parseIndentText(text), parseIndentTree(text));
});

test('throws on non-string input', () => {
  assert.throws(() => parseIndentTree(123), TypeError);
});

test('rejects invalid indent size in serializeTree', () => {
  assert.throws(() => serializeTree([], 0), RangeError);
  assert.throws(() => serializeTree([], 1.5), RangeError);
});
