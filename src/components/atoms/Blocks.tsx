import React from 'react';

// Heading Block
interface HeadingBlockProps {
    content: string;
}
export const HeadingBlock: React.FC<HeadingBlockProps> = ({ content }) => (
    <h1>{content}</h1>
);

// Paragraph Block
interface ParagraphBlockProps {
    content: string;
}
export const ParagraphBlock: React.FC<ParagraphBlockProps> = ({ content }) => (
    <p>{content}</p>
);

// Image Block
interface ImageBlockProps {
    src: string;
    alt?: string;
}
export const ImageBlock: React.FC<ImageBlockProps> = ({ src, alt }) => (
    <img src={src} alt={alt || ''} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
);
