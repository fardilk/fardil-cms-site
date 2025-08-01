import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Routes, Route } from 'react-router-dom';
import Login from '../../pages/Login';
import Dashboard from '../../pages/Dashboard';
import Category from '../../pages/Category';
import ArticlePage from '../../pages/ArticlePage';
import ArticlePageDetail from '../../pages/ArticlePageDetail';
import ProtectedRoute from '../func/ProtectedRoute';

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
    </Routes>
  </DndProvider>
);

export default AppRouter;