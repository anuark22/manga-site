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
import { SearchBarProvider } from './Context/SearchBarContext';
import { ThemeProvider } from './Context/ThemeContext';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/manga-section" element={<Library />} />
          <Route path="/manga/:id" element={<MangaDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forum" element={<Forum />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default function Root() {
  return (
    <ThemeProvider>
      <SearchBarProvider>
        <App />
      </SearchBarProvider>
    </ThemeProvider>
  );
}
