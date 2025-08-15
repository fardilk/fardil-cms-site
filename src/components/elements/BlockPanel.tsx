import React, { useState } from 'react';
import AccordionSection from '@/components/atoms/Accordion';
import ElementItem from '@/components/atoms/ElementItem';

const BlockPanel: React.FC = () => {
  const [open, setOpen] = useState({ hp: true, visual: true, others: true });
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-lg font-bold mb-4">Elements Panel</h2>
      <div className="flex flex-col gap-3">
        <AccordionSection title="Headings & Paragraphs" open={open.hp} onToggle={()=>setOpen(o=>({...o,hp:!o.hp}))}>
          <ElementItem type={`heading`} icon={<i className="fas fa-heading text-blue-400 text-xl"/>} label="Heading" />
          <ElementItem type="paragraph" icon={<i className="fas fa-paragraph text-blue-300 text-base"></i>} label="Paragraph" />
        </AccordionSection>

        <AccordionSection title="Visual" open={open.visual} onToggle={()=>setOpen(o=>({...o,visual:!o.visual}))}>
          <ElementItem type="image" icon={<i className="fas fa-image text-blue-400 text-xl"></i>} label="Image" />
          <ElementItem type="video" icon={<i className="fas fa-video text-blue-400 text-xl"></i>} label="Video" />
        </AccordionSection>

        <AccordionSection title="Others" open={open.others} onToggle={()=>setOpen(o=>({...o,others:!o.others}))}>
          <ElementItem type="blockquote" icon={<i className="fas fa-quote-left text-gray-400"></i>} label="Blockquote" />
          <ElementItem type="pullquote" icon={<i className="fas fa-quote-right text-gray-400"></i>} label="Pull Quote" />
          <ElementItem type="code" icon={<i className="fas fa-code text-gray-500"></i>} label="Code Block" />
          <ElementItem type="table" icon={<i className="fas fa-table text-gray-500"></i>} label="Table" />
          <ElementItem type="divider" icon={<i className="fas fa-minus w-8 text-blue-200 text-xl"></i>} label="Divider" />
        </AccordionSection>
      </div>
      <div className="mt-4 text-xs text-gray-500">
        Drag an element to the editor to add it to your article.
      </div>
    </div>
  );
};

export default BlockPanel;