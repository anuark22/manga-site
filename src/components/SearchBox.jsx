import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearchTerm } from '../Context/SearchBarContext';
import { mangasApi } from '../services/api';
import { getMangaImage } from '../utils/imageHelper';
import { useClickOutside } from '../hooks/useClickOutside';

const SearchBox = ({ isMobile = false, onAfterNavigate }) => {
  const { searchTerm, setSearchTerm } = useSearchTerm();
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const containerRef = useClickOutside(() => {
    setIsOpen(false);
  });

  // Búsqueda con debounce para las sugerencias del desplegable
  useEffect(() => {
    const trimmed = (searchTerm || '').trim();
    if (!trimmed) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await mangasApi.getMangas({ mangaTittle: trimmed });
        setSuggestions(results ? results.slice(0, 5) : []);
        setIsOpen(true);
      } catch (err) {
        console.warn('Error fetching search suggestions:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    setIsOpen(false);
    if (onAfterNavigate) onAfterNavigate();
    navigate('/manga-section');
  };

  const handleClear = () => {
    setSearchTerm('');
    setSuggestions([]);
    setIsOpen(false);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleSelectManga = (mangaId) => {
    setIsOpen(false);
    if (onAfterNavigate) onAfterNavigate();
    navigate(`/manga/${mangaId}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className={`search-container ${isMobile ? 'is-mobile' : ''}`} ref={containerRef}>
      <form onSubmit={handleSubmit} className="search-form">
        <input 
          ref={inputRef}
          type="text" 
          name="search" 
          value={searchTerm || ''}
          placeholder="Buscar mangas..." 
          onChange={e => setSearchTerm(e.target.value)}
          onFocus={() => {
            if ((searchTerm || '').trim().length > 0 && suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />

        {searchTerm && (
          <button 
            type="button" 
            className="search-clear-btn" 
            onClick={handleClear}
            title="Limpiar búsqueda"
          >
            <i className="fa fa-times" aria-hidden="true"></i>
          </button>
        )}

        <button 
          type="submit" 
          className="search-submit-btn" 
          title="Buscar mangas en catálogo"
        >
          {loading ? (
            <i className="fa fa-spinner fa-spin" aria-hidden="true"></i>
          ) : (
            <i className="fa fa-search" aria-hidden="true"></i>
          )}
        </button>
      </form>

      {isOpen && (searchTerm || '').trim().length > 0 && (
        <div className="search-suggestions-dropdown">
          {suggestions.length > 0 ? (
            <>
              <div className="suggestions-list">
                {suggestions.map(manga => {
                  const id = manga.mangaId || manga.id;
                  const title = manga.mangaName || manga.mangaTittle;
                  const type = manga.mangaType || manga.mangaTypeName || 'Manga';
                  const demography = manga.mangaDemography || manga.demographyName || '';
                  const img = getMangaImage(manga);

                  return (
                    <div 
                      key={id} 
                      className="suggestion-item" 
                      onClick={() => handleSelectManga(id)}
                    >
                      <img src={img} alt={title} className="suggestion-thumb" />
                      <div className="suggestion-info">
                        <div className="suggestion-title">{title}</div>
                        <div className="suggestion-meta">
                          <span className="suggestion-badge">{type}</span>
                          {demography && <span className="suggestion-demo">{demography}</span>}
                        </div>
                      </div>
                      <i className="fa fa-angle-right suggestion-arrow" aria-hidden="true"></i>
                    </div>
                  );
                })}
              </div>
              <div className="suggestion-footer" onClick={handleSubmit}>
                <span>Ver todos los resultados en Library</span>
                <i className="fa fa-arrow-right" aria-hidden="true"></i>
              </div>
            </>
          ) : !loading ? (
            <div className="no-suggestions">
              <i className="fa fa-search-minus" style={{ marginRight: '6px', opacity: 0.7 }}></i>
              No se encontraron mangas para "<b>{searchTerm}</b>"
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SearchBox;
