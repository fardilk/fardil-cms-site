import React from 'react';
import { useParams } from 'react-router-dom';
import { useContentBlocks } from '@/components/func/contentBlocks';
import { ToggleHeadingBlock, ParagraphBlock, Blockquote, PullQuote, CodeBlock, ImageUploader, VideoBlock, TableBlock, DividerBlock } from '@/components/atoms/Blocks';

// Simple preview: renders the same components read-only-ish using current in-memory state
const Preview: React.FC = () => {
  const { id } = useParams();
  // In a real app you'd fetch by id; here we assume same in-memory state via a shared store/hook.
  const { contentBlocks } = useContentBlocks();

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold mb-4">Preview for {id}</h1>
      {contentBlocks.map((block) => {
        switch (block.type) {
          case 'heading':
            return <ToggleHeadingBlock key={block.id} content={block.data.content ?? ''} level={block.data.level ?? 1} />;
          case 'paragraph':
            return <ParagraphBlock key={block.id} content={block.data.content ?? ''} />;
          case 'blockquote':
            return <Blockquote key={block.id} content={block.data.content ?? ''} />;
          case 'pullquote':
            return <PullQuote key={block.id} content={block.data.content ?? ''} />;
          case 'code':
            return <CodeBlock key={block.id} code={block.data.code ?? ''} />;
          case 'image':
            return <ImageUploader key={block.id} mode={(block.data.mode as 'single'|'gallery') || 'single'} images={block.data.images || []} />;
          case 'video':
            return <VideoBlock key={block.id} url={block.data.url} mode={(block.data.videoMode as 'embed'|'upload') || 'embed'} />;
          case 'table':
            return <TableBlock key={block.id} rows={block.data.rows} cols={block.data.cols} />;
          case 'divider':
            return <DividerBlock key={block.id} />;
          default:
            return null;
        }
      })}
    </div>
  );
};

export default Preview;
