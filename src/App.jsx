import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles/app.scss';
import Layout from './components/Layout';
import Library from './components/Library';
import Login from './components/Login';
import Register from './components/Register';
import Forum from './components/Forum';
import Main from './components/Main';
import MangaDetail from './components/MangaDetail';
import Profile from './components/Profile';
import MangaReader from './components/MangaReader';
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
          <Route path="/profile" element={<Profile />} />
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
