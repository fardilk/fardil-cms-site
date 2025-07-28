import React, { useState } from 'react';
import { FaPen, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { apiFetch } from '../lib/api';
import { useCategory } from '../hooks/useCategory';
import GlobalLayout from '../components/layout/GlobalLayout';

// Types
type CategoryType = {
  id: number;
  name: string;
  slug?: string;
  [key: string]: unknown;
};

const Category: React.FC = () => {
  const { categories, refresh, loading, error: fetchError } = useCategory();
  const [showModal, setShowModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  const handleEdit = (cat: CategoryType) => {
    setEditId(cat.id);
    setNewCategory(cat.name);
    setNewSlug(cat.slug || '');
    setShowModal(true);
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      setError('Category name is required');
      return;
    }
    if (!newSlug.trim()) {
      setError('Slug is required and cannot be empty!');
      toast.error('Slug is required and cannot be empty!');
      return;
    }
    const nameExists = categories.some(
      cat => cat.name.toLowerCase() === newCategory.trim().toLowerCase() && cat.id !== editId
    );
    const slugExists = categories.some(
      cat => (typeof cat.slug === 'string' ? cat.slug : '').toLowerCase() === newSlug.trim().toLowerCase() && cat.id !== editId
    );
    if (nameExists) {
      setError('Category name already exists');
      toast.error('Category name already exists');
      return;
    }
    if (slugExists) {
      setError('Slug already exists');
      toast.error('Slug already exists');
      return;
    }
    try {
      if (editId) {
        const response = await apiFetch(`/api/categories/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newCategory, slug: newSlug }),
        });
        if (!response.ok) throw new Error('Failed to update category');
        toast.success('Category updated');
      } else {
        const response = await apiFetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newCategory, slug: newSlug }),
        });
        if (!response.ok) throw new Error('Failed to add category');
        toast.success('Category added');
      }
      setShowModal(false);
      setNewCategory('');
      setNewSlug('');
      setEditId(null);
      setError('');
      await refresh();
    } catch {
      setError('Failed to save category');
      toast.error('Failed to save category');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      const response = await apiFetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete category');
      toast.success('Category deleted');
      await refresh();
    } catch {
      toast.error('Failed to delete category');
    }
  };

  return (
    <GlobalLayout>
      <div className="bg-white rounded-xl shadow p-8 w-full h-full min-h-[calc(100vh-96px)]">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-4xl font-bold">Kategori</h1>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 cursor-pointer rounded shadow"
            onClick={() => setShowModal(true)}
          >
            + Tambah Kategori
          </button>
        </div>
        {!showModal ? (
          <>
            {loading && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                <span className="ml-4 text-blue-500">Loading categories...</span>
              </div>
            )}
            {fetchError && (
              <div className="text-red-600 text-center py-4">{fetchError}</div>
            )}
            <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
              <thead>
                <tr>
                  <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                  <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                  <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(categories) &&
                  categories
                    .filter(cat => cat && typeof cat.id !== 'undefined')
                    .sort((a, b) => a.name.localeCompare(b.name)) // <-- Sort ascending by name
                    .slice((page - 1) * perPage, page * perPage)
                    .map((cat, idx) => (
                      <tr
                        key={`cat-${cat.id}`}
                        className={idx % 2 === 0 ? 'bg-gray-50 hover:bg-gray-100' : 'bg-white hover:bg-gray-50'}
                      >
                        <td className="px-6 py-4 border-b">{(page - 1) * perPage + idx + 1}</td>
                        <td className="px-6 py-4 border-b">{cat.name}</td>
                        <td className="px-6 py-4 border-b">{String(cat.slug || '-')}</td>
                        <td className="px-6 py-4 border-b flex gap-4">
                          <button
                            className="text-green-600 hover:text-green-700 p-2 rounded cursor-pointer"
                            title="Edit"
                            onClick={() => handleEdit(cat)}
                          >
                            <FaPen />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-700 p-2 rounded cursor-pointer"
                            title="Delete"
                            onClick={() => handleDelete(cat.id)}
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-gray-500">
                Showing {(page - 1) * perPage + 1}
                -{Math.min(page * perPage, categories.length)} of {categories.length}
              </span>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 rounded border bg-gray-100 text-gray-700 cursor-pointer disabled:opacity-50"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </button>
                <button
                  className="px-3 py-1 rounded border bg-gray-100 text-gray-700 cursor-pointer disabled:opacity-50"
                  onClick={() => setPage(page + 1)}
                  disabled={page * perPage >= categories.length}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full max-w-lg p-8 bg-white rounded-lg shadow-lg">
            <h3 className="text-xl font-sm mb-6 text-left">{editId ? 'Edit Kategori' : 'Tambahkan Kategori'}</h3>
            <input
              type="text"
              className="border rounded px-3 py-2 w-full mb-2"
              placeholder="Category name"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              autoFocus
            />
            <input
              type="text"
              className="border rounded px-3 py-2 w-full mb-2"
              placeholder="Slug (unique)"
              value={newSlug}
              onChange={e => setNewSlug(e.target.value)}
            />
            {error && <div className="text-red-600 text-sm mb-4">{error}</div>}
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded cursor-pointer"
                onClick={() => { setShowModal(false); setError(''); setNewCategory(''); setNewSlug(''); setEditId(null); }}
              >
                Cancel
              </button>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded cursor-pointer"
                onClick={handleAddCategory}
              >
                {editId ? 'Save' : 'Add'}
              </button>
            </div>
          </div>
        )}
      </div>
    </GlobalLayout>
  );
};

export default Category;