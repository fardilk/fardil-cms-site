import React from 'react';
import { useDrag } from 'react-dnd';

export const BLOCK_TYPE = 'BLOCK';

const ElementItem = ({ type, icon, label }: { type: string; icon: React.ReactNode; label: string }) => {
  const [{ isDragging }, drag] = useDrag({
    type: BLOCK_TYPE,
    item: { type: BLOCK_TYPE, blockType: type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return drag(
    <div
      className={`flex items-center bg-gray-100 rounded-lg p-4 h-14 transition-colors hover:bg-blue-100 hover:shadow-md cursor-move`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <span className="mr-4 w-10 flex-shrink-0 text-center">{icon}</span>
      <span className="text-xs text-gray-600">{label}</span>
    </div>
  );
};

const BlockPanel: React.FC = () => (
  <div className="bg-white rounded-xl shadow p-6">
    <h2 className="text-lg font-bold mb-4">Elements Panel</h2>
    <div className="flex flex-col gap-4">
      <ElementItem
      type="heading1"
      icon={<i className="fas fa-heading text-blue-400 text-2xl"></i>}
      label="Heading 1"
      />
      <ElementItem
      type="paragraph"
      icon={<i className="fas fa-paragraph text-blue-300 text-base"></i>}
      label="Paragraph"
      />
      <ElementItem
      type="image"
      icon={<i className="fas fa-image text-blue-400 text-2xl"></i>}
      label="Image"
      />
      <ElementItem
      type="divider"
      icon={<i className="fas fa-minus w-8 text-blue-200 text-xl"></i>}
      label="Divider"
      />
    </div>
    <div className="mt-4 text-xs text-gray-500">
      Drag an element to the editor to add it to your article.
    </div>
  </div>
);

export default BlockPanel;