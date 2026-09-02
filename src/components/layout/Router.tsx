import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Routes, Route } from 'react-router-dom';
import Login from '../../pages/Login';
import Dashboard from '../../pages/Dashboard';
import Category from '../../pages/Category';
import ArticlePage from '../../pages/ArticlePage';
import ArticlePageDetail from '../../pages/ArticlePageDetail';
import ProtectedRoute from '../func/ProtectedRoute';
import Preview from '@/pages/Preview';
import Media from '@/pages/Media';
import Leads from '@/pages/Leads';
import Layanan from '@/pages/Layanan';
import NotFound from '@/pages/NotFound';

const AppRouter = () => (
  <DndProvider backend={HTML5Backend}>
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/category"
        element={
          <ProtectedRoute>
            <Category />
          </ProtectedRoute>
        }
      />
      <Route
        path="/artikel"
        element={
          <ProtectedRoute>
            <ArticlePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/artikel/:id"
        element={
          <ProtectedRoute>
            <ArticlePageDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/preview/:id"
        element={
          <ProtectedRoute>
            <Preview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/halaman"
        element={
          <ProtectedRoute>
            <Layanan />
          </ProtectedRoute>
        }
      />
      <Route
        path="/media"
        element={
          <ProtectedRoute>
            <Media />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pesan"
        element={
          <ProtectedRoute>
            <Leads />
          </ProtectedRoute>
        }
      />
      {/* Catch-all: an unmatched path used to render nothing, which is
          indistinguishable from a crash. */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </DndProvider>
);

export default AppRouter;