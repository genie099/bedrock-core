import { DRAFT_BLOCKS, DRAFT_INLINE } from './const';

// Block matching
const CODE_REG = /^( {4,}|\t+)/g;
const IMAGE_REG = /^!\[.+\]\(.+\)|<img ([^>]+?)>$/;
const BLOCK_REG = /^(#{1,6}|\d+\.|[-*+>]) /g;
const LINE_BREAK_REG = / {2}|\\$/g;

// Inline matching
const LINK_REG = /(!)?\[([^\]]+)\]\(([^)]+)\)/g;
const INLINE_REG = /([_*]{1,3}|`)(.+?)(\1)|<img ([^>]+?)>/g;

// Escape matching
const ESCAPE_CHAR_REG = /\\([`*_])/g;
const ESCAPE_CODE_REG = /%%ESCAPE\((\d+)\)%%/g;

// Alternate block matching
const ALTERNATE_HEADER_REG = /^(.+)\n^([=-])+$/gm;
const FENCED_CODE_BLOCK_REG = /^```$([^`]+?)^```$/gm;

// Tables
const TABLE_REG = /(^\|.+\|$)/gms;
const TABLE_PLACEHOLDER_REG = /^%%TABLE%%$/;

// Alignment

const ALIGN_REG = /^<p style="text-align:(center|right)">(.+?)<\/p>$/gms;

export default function markdownToDraft(str) {
  let entityKey = 0;
  const tables = [];
  const entityMap = {};

  function addLink(block, options) {
    const { url, ...rest } = options;
    addEntity(block, {
      type: 'LINK',
      mutability: 'MUTABLE',
      data: {
        url,
      },
      ...rest,
    });
  }

  function addImage(block, options) {
    const { offset, data } = options;
    block.type = 'atomic';
    addEntity(block, {
      type: 'IMAGE',
      mutability: 'IMMUTABLE',
      length: 1,
      offset,
      data,
    });
  }

  function addEntity(block, options) {
    const { type, mutability, data, offset, length } = options;
    const key = entityKey++;
    entityMap[key] = {
      type,
      mutability,
      data,
    };
    block.entityRanges.push({
      key,
      offset,
      length,
    });
  }

  str = replaceMarkdown(str, ALTERNATE_HEADER_REG, ([line, char]) => {
    const prefix = char === '=' ? '#' : '##';
    return `${prefix} ${line}`;
  });

  str = replaceMarkdown(str, FENCED_CODE_BLOCK_REG, ([content]) => {
    return content
      .trim()
      .split('\n')
      .map((line) => {
        return `    ${line}`;
      })
      .join('\n');
  });

  str = replaceMarkdown(str, TABLE_REG, ([content]) => {
    return content
      .split('\n\n')
      .map((block) => {
        const lines = block.split('\n');
        const rows = lines.map((line) => {
          line = line.replace(/^\|(.+)\|/, '$1');
          return line.split(/\s*\|\s*/).map((str) => {
            return str.trim();
          });
        });
        if (rows.length > 2) {
          const colLength = rows[0].length;
          const even = rows.every((cols) => {
            return cols.length === colLength;
          });
          const separated = rows[1].every((col) => {
            return /^-{3,}$/.test(col);
          });
          if (even && separated) {
            tables.push({
              head: rows[0],
              body: rows.slice(2),
            });
            block = '%%TABLE%%';
          }
        }
        return block;
      })
      .join('\n\n');
  });

  const blocks = getBlocks(str);

  for (let block of blocks) {
    let { text } = block;
    block.depth = 0;
    block.entityRanges = [];
    block.inlineStyleRanges = [];

    text = replaceMarkdown(text, ESCAPE_CHAR_REG, (groups) => {
      const [char] = groups;
      return `%%ESCAPE(${char.codePointAt(0)})%%`;
    });

    text = replaceMarkdown(text, ALIGN_REG, (groups) => {
      const [alignment, content] = groups;
      block.data = {
        alignment,
      };
      return content;
    });

    text = replaceMarkdown(text, INLINE_REG, (groups, offset) => {
      const [start, str, , img] = groups;
      if (start) {
        const style = DRAFT_INLINE[start.replace(/_/g, '*')];
        block.inlineStyleRanges.push({
          style,
          offset,
          length: str.length,
        });
        return str;
      } else if (img) {
        const { src, alt: title, style = {} } = getAttrs(img);
        const { width, float, margin } = style;
        const data = {
          src,
          title,
        };
        if (width) {
          data.width = parseInt(width);
        }
        if (float) {
          data.alignment = float;
        } else {
          data.alignment = margin === '0 auto' ? 'center' : 'default';
        }
        addImage(block, {
          offset,
          data,
        });
        return ' ';
      }
    });

    text = replaceMarkdown(text, LINK_REG, (groups, offset) => {
      const [img, str, url] = groups;
      if (img) {
        addImage(block, {
          offset,
          data: {
            src: url,
            title: str,
          },
        });
        return ' ';
      } else {
        addLink(block, {
          url,
          offset,
          length: str.length,
        });
        return str;
      }
    });

    text = replaceMarkdown(text, TABLE_PLACEHOLDER_REG, () => {
      block.type = 'atomic';
      addEntity(block, {
        type: 'TABLE',
        mutability: 'IMMUTABLE',
        length: 1,
        offset: 0,
        data: tables.shift(),
      });
      return ' ';
    });

    text = replaceMarkdown(text, ESCAPE_CODE_REG, (groups) => {
      const [code] = groups;
      return String.fromCodePoint(code);
    });

    block.text = text;
  }

  return {
    blocks,
    entityMap,
  };
}

// Block helpers

function getBlocks(str) {
  const blocks = [];
  const lines = str.split('\n');
  let current;
  for (let line of lines) {
    const meta = getBlockMeta(line);
    let { type, text, isEmpty } = meta;
    const isUnstyled = type === 'unstyled';
    if (isUnstyled && !isEmpty && current?.isCollapsable) {
      current.block.text += current.spacer + meta.text.trimStart();
    } else {
      current = {
        ...meta,
        block: {
          type,
          text,
        },
      };
      blocks.push(current.block);
    }
  }
  return blocks;
}

function getBlockMeta(text) {
  let type = 'unstyled';
  let hasLineBreak = false;
  text = text.replace(BLOCK_REG, (all, prefix) => {
    prefix = prefix.replace(/^\d\./, 'n.');
    type = DRAFT_BLOCKS[prefix];
    return '';
  });
  text = text.replace(CODE_REG, () => {
    type = 'code-block';
    return '';
  });
  text = text.replace(TABLE_PLACEHOLDER_REG, (str) => {
    type = 'atomic';
    return str;
  });
  text = text.replace(LINE_BREAK_REG, () => {
    hasLineBreak = true;
    return '';
  });
  const isEmpty = !text.trim();
  const isImage = IMAGE_REG.test(text);
  const spacer = hasLineBreak ? '\n' : ' ';

  const isCollapsable =
    !isEmpty &&
    !isImage &&
    (isListType(type) || (isParagraphType(type) && !hasLineBreak));

  return {
    type,
    text,
    spacer,
    isEmpty,
    isCollapsable,
  };
}

function isListType(type) {
  return type === 'unordered-list-item' || type === 'ordered-list-item';
}

function isParagraphType(type) {
  return type === 'unstyled' || type === 'blockquote';
}

// Inline helpers

const ATTR_REG = /(\w+)="(.+?)"/g;

function getAttrs(str) {
  const map = {};
  for (let match of str.matchAll(ATTR_REG)) {
    let [, attr, value] = match;
    if (attr === 'style') {
      map[attr] = getStyles(value);
    } else {
      map[attr] = value;
    }
  }
  return map;
}

function getStyles(str) {
  const styles = {};
  for (let dec of str.trim().split(';')) {
    const [prop, value] = dec.trim().split(/:\s?/);
    if (prop && value) {
      styles[prop] = value;
    }
  }
  return styles;
}

// Replace helpers

function replaceMarkdown(str, reg, fn) {
  let shift = 0;
  return str.replace(reg, (match, ...args) => {
    const groups = args.slice(0, -2);
    const [offset] = args.slice(-2);
    const str = fn(groups, offset - shift);
    shift += match.length - str.length;
    return str;
  });
}
