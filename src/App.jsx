import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles/app.scss';
import Layout from './components/Layout';
import Library from './components/Library';
import Login from './components/Login';
import Register from './components/Register';
import Forum from './components/Forum';
import ForumPostDetail from './components/ForumPostDetail';
import News from './components/News';
import Main from './components/Main';
import MangaDetail from './components/MangaDetail';
import Profile from './components/Profile';
import MangaReader from './components/MangaReader';
import ScanDashboard from './components/ScanDashboard';
import AdminDashboard from './components/AdminDashboard';
import { SearchBarProvider } from './Context/SearchBarContext';
import { ThemeProvider } from './Context/ThemeContext';
import { AuthProvider } from './Context/AuthContext';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/manga-section" element={<Library />} />
          <Route path="/my-list" element={<Library isMyList={true} />} />
          <Route path="/manga/:id" element={<MangaDetail />} />
          <Route path="/manga/:id/chapter/:chapterId" element={<MangaReader />} />
          <Route path="/reader/:chapterId" element={<MangaReader />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forum" element={<Forum />} />
          <Route path="/forum/post/:id" element={<ForumPostDetail />} />
          <Route path="/forum/:id" element={<ForumPostDetail />} />
          <Route path="/news" element={<News />} />
          <Route path="/news/:id" element={<News />} />
          <Route path="/notices" element={<News />} />
          <Route path="/notices/:id" element={<News />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/scan-dashboard" element={<ScanDashboard />} />
          <Route path="/scan-panel" element={<ScanDashboard />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/admin-panel" element={<AdminDashboard />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default function Root() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SearchBarProvider>
          <App />
        </SearchBarProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
