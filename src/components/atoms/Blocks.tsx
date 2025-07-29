import React, { useState } from 'react';

export const HeadingBlock = ({
  content,
  onChange,
}: {
  content: string;
  onChange?: (val: string) => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(content);

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const text = e.currentTarget.textContent || '';
    setValue(text);
    setEditing(false);
    if (onChange) {
      onChange(text);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const text = e.currentTarget.textContent || '';
      setValue(text);
      setEditing(false);
      if (onChange) {
        onChange(text);
      }
      e.currentTarget.blur();
    }
  };

  return (
    <div
      className={`rounded-lg px-4 py-3 my-2 font-bold text-2xl transition-colors hover:border hover:border-blue-50`}
      contentEditable={editing}
      suppressContentEditableWarning
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      onClick={() => setEditing(true)}
      style={{ userSelect: editing ? 'text' : 'none', cursor: editing ? 'text' : 'grab' }}
    >
      {value}
    </div>
  );
};

export const ParagraphBlock = ({
  content,
  onChange,
}: {
  content: string;
  onChange?: (val: string) => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(content);

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const text = e.currentTarget.textContent || '';
    setValue(text);
    setEditing(false);
    if (onChange) {
      onChange(text);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const text = e.currentTarget.textContent || '';
      setValue(text);
      setEditing(false);
      if (onChange) {
        onChange(text);
      }
      e.currentTarget.blur();
    }
  };

  return (
    <div
      className={`bg-gray-50 rounded-lg px-4 py-3 my-2 text-base transition-colors hover:border hover:border-blue-50 ${editing ? 'cursor-text' : 'cursor-grab'}`}
      contentEditable={editing}
      suppressContentEditableWarning
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      onClick={() => setEditing(true)}
      style={{ userSelect: editing ? 'text' : 'none' }}
    >
      {value}
    </div>
  );
};

export const ImageBlock = ({
  src,
  alt,
}: {
  src: string;
  alt?: string;
}) => (
  <img
    src={src}
    alt={alt}
    className="my-4 max-h-48 rounded-lg object-contain shadow"
  />
);

export const DividerBlock = () => (
  <div className="my-4 flex justify-center">
    <div className="w-2/3 h-0.5 bg-gray-300 rounded transition-colors hover:border hover:border-blue-50"></div>
  </div>
);

export default {
  HeadingBlock,
  ParagraphBlock,
  ImageBlock,
  DividerBlock,
};
