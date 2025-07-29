import React from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/GlobalLayout';
import { useEffect, useState } from 'react';
import { Article } from '@/hooks/useArticle';
import { HeadingBlock, ParagraphBlock, ImageBlock, DividerBlock } from '@/components/atoms/Blocks';
import BlockPanel from '@/components/elements/BlockPanel';
import { useContentBlocks } from '@/components/func/contentBlocks';
import type { ContentBlock } from '@/components/func/contentBlocks';
import Seo from '@/elements/Seo';
import { DraggableBlock, BLOCK_TYPE } from '@/components/atoms/DraggableBlock';
import { useDrop } from 'react-dnd';

const ArticlePageDetail = () => {
  const { id } = useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const { contentBlocks, setContentBlocks } = useContentBlocks();

  const moveBlock = (from: number, to: number) => {
    const updated = [...contentBlocks];
    const [removed] = updated.splice(from, 1);
    updated.splice(to, 0, removed);
    setContentBlocks(updated);
  };

  useEffect(() => {
    fetch(`http://localhost:8000/api/articles/${id}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        console.log('Fetched article:', data); // Add this line
        setArticle(data);
      });
  }, [id]);

  // Helper to create a new block from type
  const createBlock = (type: string) => {
    switch (type) {
      case 'heading1':
        return { id: Date.now().toString(), type: 'heading1', data: { content: 'New Heading' } };
      case 'paragraph':
        return { id: Date.now().toString(), type: 'paragraph', data: { content: 'New paragraph...' } };
      case 'image':
        return { id: Date.now().toString(), type: 'image', data: { src: '', alt: '' } };
      case 'divider':
        return { id: Date.now().toString(), type: 'divider', data: {} };
      default:
        return null;
    }
  };

  // DropZone component for insertion
  type DropItem = { type: string; blockType?: string; id?: string; index?: number };
  function DropZone({ onDrop, isActive }: { onDrop: (block: ContentBlock) => void; isActive: boolean }) {
    const [{ isOver }, drop] = useDrop({
      accept: BLOCK_TYPE,
      drop: (item: DropItem) => {
        // Only insert a new block if blockType is present (from panel)
        if (item.blockType) {
          const newBlock = createBlock(item.blockType);
          if (newBlock) onDrop(newBlock);
        }
        // If no blockType, it's a reorder, handled by DraggableBlock hover
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    });
    return drop(
      <div
        style={{
          minHeight: '16px',
          height: '16px',
          margin: '4px 0',
          background: isOver || isActive ? '#3b82f6' : 'transparent',
          borderRadius: '4px',
          transition: 'background 0.2s',
          pointerEvents: 'all',
          zIndex: 2,
        }}
      />
    );
  }

  if (!article) return <DashboardLayout><div>Loading...</div></DashboardLayout>;

  return (
    
      <DashboardLayout>
        <div>
          <div className="flex mt-8 gap-8">
            {/* Content Area (Drop Zone) */}
            <div
              className="w-full max-w-4xl bg-white rounded-xl shadow p-8"
              style={{
                minHeight: '700px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              }}
            >
              {/* Render DropZone before first block */}
              <DropZone
                onDrop={newBlock => {
                  setContentBlocks([newBlock, ...contentBlocks]);
                }}
                isActive={false}
              />
              {contentBlocks.map((block, idx) => (
                <React.Fragment key={block.id}>
                  <DraggableBlock
                    id={block.id}
                    index={idx}
                    moveBlock={moveBlock}
                  >
                    {(() => {
                      switch (block.type) {
                        case 'heading1':
                          return <HeadingBlock content={block.data.content ?? ''} />;
                        case 'paragraph':
                          return <ParagraphBlock content={block.data.content ?? ''} />;
                        case 'image':
                          return <ImageBlock src={block.data.src ?? ''} alt={block.data.alt ?? ''} />;
                        case 'divider':
                          return <DividerBlock />;
                        default:
                          return null;
                      }
                    })()}
                  </DraggableBlock>
                  {/* DropZone after each block */}
                  <DropZone
                    onDrop={newBlock => {
                      setContentBlocks([
                        ...contentBlocks.slice(0, idx + 1),
                        newBlock,
                        ...contentBlocks.slice(idx + 1),
                      ]);
                    }}
                    isActive={false}
                  />
                </React.Fragment>
              ))}
            </div>
            {/* Elements panel */}
            <div className="w-full md:w-2/5">
              <BlockPanel />
            </div>
          </div>

          {/* SEO Parts */}
          <Seo article={article} />
        </div>
      </DashboardLayout>

  );
};

export default ArticlePageDetail;
