import { useParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/GlobalLayout';
import { useEffect, useState } from 'react';
import { Article } from '../hooks/useArticle';
import { HeadingBlock, ParagraphBlock, ImageBlock } from '@/components/atoms/Blocks';

const ArticlePageDetail = () => {
  const { id } = useParams();
  const [article, setArticle] = useState<Article | null>(null);

  useEffect(() => {
    fetch(`http://localhost:8000/api/articles/${id}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setArticle(data));
  }, [id]);

  if (!article) return <DashboardLayout><div>Loading...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div>
        <div className="flex mt-8 gap-8">
          <div className="w-full md:w-[80%] max-w-3xl bg-white rounded-xl shadow p-8">
            <div className="text-3xl font-extrabold mb-6">Sample Article Title Goes Here</div>
            
            {/* Content Blocks - Render using reusable components */}
            <div
              className="mb-6 bg-white rounded-xl"
              style={{
                minHeight: '700px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)', // deeper, softer shadow
              }}
            >
              {article.contentBlocks?.map((block, idx) => {
                switch (block.type) {
                  case 'heading1':
                    return (
                      <HeadingBlock
                        key={idx}
                        content={block.content}
                      />
                    );
                  case 'paragraph':
                    return (
                      <ParagraphBlock
                        key={idx}
                        content={block.content}
                      />
                    );
                  case 'image':
                    return (
                      <ImageBlock
                        key={idx}
                        src={block.src ? `/images/${block.src.split('/').pop()}` : '/images/default-image.png'}
                        alt={block.alt || article.title}
                      />
                    );
                  default:
                    return null;
                }
              })}
              {/* TODO: Add drag-and-drop logic for reordering blocks */}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="font-semibold text-gray-700 mb-2">Description</h2>
                <p className="text-gray-600">{article.excerpt || article.meta_description}</p>
              </div>
              <div>
                <h2 className="font-semibold text-gray-700 mb-2">Category</h2>
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">{article.category}</span>
              </div>
              <div>
                <h2 className="font-semibold text-gray-700 mb-2">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(article.tags) && article.tags.map((tag, idx) => (
                    <span key={idx} className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">{tag}</span>
                  ))}
                </div>
              </div>
              <div>
                <h2 className="font-semibold text-gray-700 mb-2">Status</h2>
                <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-200 text-gray-600">{article.status}</span>
              </div>
            </div>
          </div>
          <div className="w-full md:w-2/5">
            {/* Add your right column content here */}
          </div>
        </div>



        {/* SEO Parts */}
        <div className="mt-8 bg-white rounded-xl shadow p-8 max-w-3xl">
          <h2 className="text-xl font-bold mb-4">SEO Settings</h2>
          <div className="mb-4">
            <label className="block font-semibold mb-1" htmlFor="metaTitle">Meta Title</label>
            <input
              id="metaTitle"
              type="text"
              maxLength={90}
              className="w-full border rounded px-3 py-2"
              value={article.meta_title || ''}
              onChange={() => {}}
              placeholder="Enter meta title (max 90 characters)"
            />
            <div className="text-xs text-gray-500 mt-1">{(article.meta_title?.length || 0)}/90 characters</div>
          </div>
          <div className="mb-4">
            <label className="block font-semibold mb-1" htmlFor="metaDescription">Meta Description</label>
            <textarea
              id="metaDescription"
              rows={3}
              className="w-full border rounded px-3 py-2"
              value={article.meta_description || ''}
              onChange={() => {}}
              placeholder="Enter meta description"
            />
            <div className="mt-2 border rounded p-3 bg-gray-50">
              <div className="text-xs text-gray-500 mb-1">Google Preview</div>
              <div className="font-semibold text-blue-800 truncate">{article.meta_title || article.title}</div>
              <div className="text-green-700 text-xs mb-1">yourdomain.com/{article.slug}</div>
              <div className="text-gray-700">{article.meta_description || article.excerpt}</div>
            </div>
          </div>
          <div className="mb-4">
            <label className="block font-semibold mb-1" htmlFor="slug">Slug</label>
            <input
              id="slug"
              type="text"
              className="w-full border rounded px-3 py-2"
              value={article.slug || ''}
              onChange={() => {}}
              placeholder="Edit slug"
            />
          </div>
          <div className="mb-4">
            <label className="block font-semibold mb-1">Tags</label>
            <div className="flex flex-wrap gap-2">
              {Array.isArray(article.tags) && article.tags.map((tag, idx) => (
                <span key={idx} className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ArticlePageDetail;