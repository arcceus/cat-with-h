import React from 'react';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import type { Root, Content, Heading, Paragraph, Strong, Emphasis, InlineCode, Code, Blockquote, List, ListItem, Text } from 'mdast';
import { JSX } from 'react/jsx-runtime';

interface MarkdownWithMarkersProps {
  content: string;
  className?: string;
}

// Helper to render visible markers
function Marker({ children }: { children: React.ReactNode }) {
  return <span className="md-marker">{children}</span>;
}

function renderNode(node: Content, key?: React.Key, ordered?: any, i?: any): React.ReactNode {
  switch (node.type) {
    case 'heading': {
      const h = node as Heading;
      const Tag = `h${h.depth}` as keyof JSX.IntrinsicElements;
      const cls = [
        '',
        'text-2xl font-bold mb-3 mt-6 text-foreground',
        'text-xl font-semibold mb-2 mt-5 text-foreground',
        'text-lg font-semibold mb-2 mt-4 text-foreground',
        'text-base font-semibold mb-2 mt-3 text-foreground',
        'text-base font-semibold mb-2 mt-2 text-foreground',
        'text-base font-semibold mb-2 mt-1 text-foreground',
      ];
      return (
        <Tag className={cls[h.depth]} key={key}>
          <Marker>{'#'.repeat(h.depth)}</Marker>{' '}
          {h.children.map((c: any, i: React.Key | undefined) => renderNode(c, i))}
        </Tag>
      );
    }
    case 'paragraph': {
      const p = node as Paragraph;
      return (
        <p className="mb-4 text-base leading-relaxed tracking-normal text-foreground" key={key}>
          {p.children.map((c: any, i: React.Key | undefined) => renderNode(c, i))}
        </p>
      );
    }
    case 'strong': {
      const s = node as Strong;
      return (
        <>
          <Marker>**</Marker>
          <span className="md-bold" key={key}>{s.children.map((c: any, i: React.Key | undefined) => renderNode(c, i))}</span>
          <Marker>**</Marker>
        </>
      );
    }
    case 'emphasis': {
      const e = node as Emphasis;
      // Use * for marker
      return (
        <>
          <Marker>*</Marker>
          <span className="md-italic" key={key}>{e.children.map((c: any, i: React.Key | undefined) => renderNode(c, i))}</span>
          <Marker>*</Marker>
        </>
      );
    }
    case 'inlineCode': {
      const ic = node as InlineCode;
      return (
        <>
          <Marker>`</Marker>
          <code className="md-inline" key={key}>{ic.value}</code>
          <Marker>`</Marker>
        </>
      );
    }
    case 'code': {
      const c = node as Code;
      return (
        <div className="codeblock-markdown my-2 rounded-md overflow-hidden" key={key}>
          <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
            <span className="text-xs font-medium text-muted-foreground uppercase">{c.lang || 'text'}</span>
          </div>
          <div className="overflow-x-auto px-3 py-2">
            <Marker>{'```'}</Marker>
            <pre className="text-sm font-mono m-0 overflow-x-auto" style={{ background: '#f5f5f5', borderRadius: 3 }}>{c.value}</pre>
            <Marker>{'```'}</Marker>
          </div>
        </div>
      );
    }
    case 'blockquote': {
      const bq = node as Blockquote;
      return (
        <blockquote className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground my-4 py-1" key={key}>
          <Marker>&gt;</Marker>{' '}
          {bq.children.map((c: any, i: React.Key | undefined) => renderNode(c, i))}
        </blockquote>
      );
    }
    case 'list': {
      const l = node as List;
      // Render each item as a paragraph with marker
      return (
        <>
          {l.children.map((c: any, i: number) => renderNode(c, i, l.ordered, i))}
        </>
      );
    }
    case 'listItem': {
      const li = node as ListItem;
      const markerContent = ordered ? `${i + 1}.` : '*';
      return (
        <p className="mb-4 text-base leading-relaxed tracking-normal text-foreground" key={key}>
          <Marker>{markerContent}</Marker>{'  '}
          {li.children.map((child, childIndex) => {
            if (child.type === 'paragraph') {
              // Unwrap the paragraph and render its inline content.
              return child.children.map((grandchild, grandChildIndex) => renderNode(grandchild, `${childIndex}-${grandChildIndex}`));
            }
            return renderNode(child, childIndex);
          })}
        </p>
      );
    }
    case 'text': {
      const t = node as Text;
      return t.value;
    }
    default:
      // Fallback for unhandled node types
      // @ts-ignore
      if (node.children) {
        // @ts-ignore
        return node.children.map((c: any, i: number) => renderNode(c, i));
      }
      return null;
  }
}

export const MarkdownWithMarkers: React.FC<MarkdownWithMarkersProps> = ({ content, className }) => {
  // Parse markdown to AST
  const tree = unified().use(remarkParse).parse(content) as Root;

  return (
    <div className={className} style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
      {tree.children.map((node: any, i: React.Key | undefined) => renderNode(node, i))}
    </div>
  );
}; 