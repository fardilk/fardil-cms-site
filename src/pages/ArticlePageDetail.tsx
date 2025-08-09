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
import { useIsDragging } from "@/components/func/useDragLayer";

const ArticlePageDetail = () => {
  const { id } = useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const { contentBlocks, setContentBlocks } = useContentBlocks();
  const isDragging = useIsDragging();

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
  function DropZone({
    onDrop,
    isActive,
    showIndicator = true, // <-- new prop
  }: {
    onDrop: (block: ContentBlock) => void;
    isActive: boolean;
    showIndicator?: boolean;
  }) {
    const isDragging = useIsDragging();
    if (!showIndicator || !isDragging) return null;

    const [{ isOver }, drop] = useDrop({
      accept: BLOCK_TYPE,
      drop: (item: DropItem) => {
        if (item.blockType) {
          const newBlock = createBlock(item.blockType);
          if (newBlock) onDrop(newBlock);
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    });
    // Only show DropZone when dragging for juxtapose, always for main dropzone
    if (!showIndicator && !isDragging) return null;
    return drop(
      <div
        style={{
          minHeight: showIndicator ? '40px' : '8px',
          height: showIndicator ? '40px' : '8px',
          margin: showIndicator ? '8px 0' : '2px 0',
          background: 'transparent',
          borderRadius: '4px',
          border: isOver || isActive
            ? '2px solid #3b82f6'
            : showIndicator
              ? '2px dashed #d1d5db'
              : 'none',
          transition: 'border 0.2s',
          pointerEvents: 'all',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* REMOVE THIS BLOCK TO REMOVE "DROP HERE" INDICATOR */}
        {/* {showIndicator && (
          <span style={{
            color: isOver || isActive ? '#3b82f6' : '#6b7280',
            fontWeight: 500,
            fontSize: '1rem',
            letterSpacing: '0.05em',
            opacity: isOver || isActive ? 1 : 0.7,
          }}>
            DROP HERE
          </span>
        )} */}
      </div>
    );
  }

  // Fallback drop for the whole content area
  const [{ isOver: isEditorOver }, editorDrop] = useDrop({
    accept: BLOCK_TYPE,
    drop: (item: DropItem, monitor) => {
      // Always add at the end, regardless of where dropped
      if (item.blockType) {
        const newBlock = createBlock(item.blockType);
        if (newBlock) setContentBlocks([...contentBlocks, newBlock]);
      }
    },
    collect: monitor => ({
      isOver: monitor.isOver({ shallow: true }),
    }),
  });

  if (!article) return <DashboardLayout><div>Loading...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div>
        <div className="flex mt-8 gap-8">
          {/* Content Area (Drop Zone) */}
          <div
            ref={editorDrop}
            className="w-full max-w-4xl bg-white rounded-xl shadow p-8 relative"
            style={{
              minHeight: '700px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              border: isEditorOver ? '2px solid #3b82f6' : undefined,
              transition: 'border 0.2s',
            }}
          >
            {/* 1. If empty, show a single dropzone */}
            {contentBlocks.length === 0 && (
              <DropZone
                onDrop={newBlock => setContentBlocks([newBlock])}
                isActive={false}
              />
            )}


            {/* 2. If blocks exist, show all blocks and one dropzone at the end */}
            {contentBlocks.length > 0 && (
              <>
                {contentBlocks.map((block, idx) => (
                  <DraggableBlock key={block.id} id={block.id} index={idx}>
                    {(() => {
                      switch (block.type) {
                        case 'heading1': return <HeadingBlock content={block.data.content ?? ''} />;
                        case 'paragraph': return <ParagraphBlock content={block.data.content ?? ''} />;
                        case 'image': return <ImageBlock src={block.data.src ?? ''} alt={block.data.alt ?? ''} />;
                        case 'divider': return <DividerBlock />;
                        default: return null;
                      }
                    })()}
                  </DraggableBlock>
                ))}
                {/* Always one dropzone after the last block for appending */}
                <DropZone
                  onDrop={newBlock => setContentBlocks([...contentBlocks, newBlock])}
                  isActive={false}
                />
              </>
            )}
            {isDragging && (
              contentBlocks.length === 0 ? (
                <DropZone
                  onDrop={newBlock => setContentBlocks([newBlock])}
                  isActive={false}
                  showIndicator={true} // Show "DROP HERE"
                />
              ) : (
                <DropZone
                  onDrop={newBlock => setContentBlocks([...contentBlocks, newBlock])}
                  isActive={false}
                  showIndicator={true} // Show "DROP HERE"
                />
              )
            )}
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
