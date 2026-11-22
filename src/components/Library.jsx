import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Card from './Card';
import '../styles/Library.scss';
import Filters from './Filters';
import GendersList from './GendersList';
import mangasData from './mangasData';
import { mangasApi, userListApi, filtersApi } from '../services/api';
import { useAuth } from '../Context/AuthContext';
import { useSearchTerm } from '../Context/SearchBarContext';
import SEO from './SEO';

const Library = ({ isMyList = false }) => {    
    const [mangas, setMangas] = useState([]);
    const [progressMap, setProgressMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [filterValues, setFilterValues] = useState({});
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [types, setTypes] = useState([]);
    const [demographics, setDemographics] = useState([]);
    const [mangaGenres, setMangaGenres] = useState([]);
    const { isAuthenticated, user, token } = useAuth();
    const { searchTerm, setSearchTerm } = useSearchTerm();

    // Carga de metadatos para nombres de filtros y relaciones manga-género
    useEffect(() => {
        let isMounted = true;
        Promise.all([
            filtersApi.getMangasType().catch(() => []),
            filtersApi.getDemographics().catch(() => []),
            filtersApi.getMangaGenres().catch(() => [])
        ]).then(([typesData, demoData, mgData]) => {
            if (isMounted) {
                if (typesData && typesData.length > 0) setTypes(typesData);
                if (demoData && demoData.length > 0) setDemographics(demoData);
                if (mgData && mgData.length > 0) setMangaGenres(mgData);
            }
        });
        return () => { isMounted = false; };
    }, []);

    const fetchMangas = useCallback(async (filters = {}, genres = []) => {
        setLoading(true);
        try {
            if (isMyList) {
                if (!isAuthenticated) {
                    setMangas([]);
                    setProgressMap({});
                    setLoading(false);
                    return;
                }
                const [data, progressData] = await Promise.all([
                    userListApi.getMyList(),
                    userListApi.getReadingProgress().catch(() => [])
                ]);
                const pMap = {};
                (progressData || []).forEach(p => {
                    if (p && p.mangaId) {
                        pMap[p.mangaId] = p;
                    }
                });
                setProgressMap(pMap);
                setMangas(data || []);
            } else {
                const params = {
                    ...filters,
                    ...(searchTerm ? { mangaTittle: searchTerm } : {})
                };
                let data = await mangasApi.getMangas(params);
                data = data || [];

                // Filtrar por géneros seleccionados utilizando las relaciones de MangaGenres
                if (genres && genres.length > 0) {
                    const selectedGenreIds = genres.map(g => (typeof g === 'object' && g.genreId ? g.genreId : g));
                    
                    let currentMg = mangaGenres;
                    if (!currentMg || currentMg.length === 0) {
                        currentMg = await filtersApi.getMangaGenres().catch(() => []);
                        setMangaGenres(currentMg);
                    }

                    if (currentMg && currentMg.length > 0) {
                        data = data.filter(m => {
                            const mId = m.mangaId || m.id;
                            const mGenres = currentMg.filter(mg => mg.mangaId === mId).map(mg => mg.genreId);
                            // El manga debe coincidir con todos los géneros seleccionados
                            return selectedGenreIds.every(id => mGenres.includes(Number(id)));
                        });
                    }
                }

                setMangas(data);
            }
        } catch (err) {
            console.warn('Error al obtener mangas, usando fallback:', err);
            if (!isMyList) {
                setMangas(mangasData);
            }
        } finally {
            setLoading(false);
        }
    }, [isMyList, isAuthenticated, token, searchTerm, mangaGenres]);

    useEffect(() => {
        fetchMangas(filterValues, selectedGenres);
    }, [fetchMangas, isMyList]);

    const handleFilterChange = (field, value) => {
        setFilterValues(prev => ({
            ...prev,
            [field]: value === '' ? undefined : value
        }));
    };

    const handleToggleGenre = (genreItem) => {
        setSelectedGenres(prev => {
            const exists = prev.some(g => {
                if (typeof g === 'object' && g !== null) {
                    return g.genreId === genreItem.genreId || g.genreName === genreItem.genreName;
                }
                return g === genreItem.genreId || g === genreItem.genreName;
            });

            if (exists) {
                return prev.filter(g => {
                    if (typeof g === 'object' && g !== null) {
                        return g.genreId !== genreItem.genreId && g.genreName !== genreItem.genreName;
                    }
                    return g !== genreItem.genreId && g !== genreItem.genreName;
                });
            } else {
                return [...prev, genreItem];
            }
        });
    };

    const handleApplyFilters = () => {
        fetchMangas(filterValues, selectedGenres);
    };

    const handleResetFilters = () => {
        setFilterValues({});
        setSelectedGenres([]);
        setSearchTerm('');
        fetchMangas({}, []);
    };

    const handleRemoveFilter = (field) => {
        const updated = { ...filterValues };
        delete updated[field];
        setFilterValues(updated);
        fetchMangas(updated, selectedGenres);
    };

    const handleRemoveGenre = (genreId) => {
        const updated = selectedGenres.filter(g => {
            if (typeof g === 'object' && g !== null) {
                return g.genreId !== genreId;
            }
            return g !== genreId;
        });
        setSelectedGenres(updated);
        fetchMangas(filterValues, updated);
    };

    // Helper para obtener nombres legibles de filtros activos
    const getTypeName = (id) => types.find(t => String(t.mangaTypeId) === String(id))?.mangaTypeName || `Tipo ${id}`;
    const getDemographyName = (id) => demographics.find(d => String(d.demographyId) === String(id))?.name || `Demografía ${id}`;

    const activeFilterPills = [];
    if (searchTerm && searchTerm.trim()) {
        activeFilterPills.push({
            id: 'searchTerm',
            label: `Búsqueda: "${searchTerm}"`,
            onRemove: () => setSearchTerm('')
        });
    }
    if (filterValues.mangaTypeId) {
        activeFilterPills.push({
            id: 'mangaTypeId',
            label: `Tipo: ${getTypeName(filterValues.mangaTypeId)}`,
            onRemove: () => handleRemoveFilter('mangaTypeId')
        });
    }
    if (filterValues.demographyId) {
        activeFilterPills.push({
            id: 'demographyId',
            label: `Demografía: ${getDemographyName(filterValues.demographyId)}`,
            onRemove: () => handleRemoveFilter('demographyId')
        });
    }
    if (filterValues.isAmateur !== undefined && filterValues.isAmateur !== '') {
        activeFilterPills.push({
            id: 'isAmateur',
            label: `Amateur: ${filterValues.isAmateur === 'true' ? 'Sí' : 'No'}`,
            onRemove: () => handleRemoveFilter('isAmateur')
        });
    }
    if (filterValues.isErotic !== undefined && filterValues.isErotic !== '') {
        activeFilterPills.push({
            id: 'isErotic',
            label: `Erótico: ${filterValues.isErotic === 'true' ? 'Sí' : 'No'}`,
            onRemove: () => handleRemoveFilter('isErotic')
        });
    }
    selectedGenres.forEach(g => {
        const gId = g.genreId || g;
        const gName = g.genreName || g;
        activeFilterPills.push({
            id: `genre-${gId}`,
            label: `Género: ${gName}`,
            onRemove: () => handleRemoveGenre(gId)
        });
    });

    return ( 
        <div className="card-section">
            <SEO
                title={isMyList ? 'Mi Lista de Mangas' : 'Biblioteca de Mangas, Manhwas y Manhuas'}
                description={isMyList
                    ? 'Tu lista personal de mangas guardados en OurMangaSite.'
                    : 'Explora nuestro catálogo completo de mangas, manhwas y manhuas filtrando por género, demografía y estado.'}
                canonicalPath={isMyList ? '/my-list' : '/manga-section'}
                noindex={isMyList}
            />
            {!isMyList ? (
                <div className="filter">
                    <Filters 
                        filterValues={filterValues} 
                        onFilterChange={handleFilterChange} 
                    />
                    <GendersList 
                        selectedGenres={selectedGenres} 
                        onToggleGenre={handleToggleGenre} 
                    />
                    <div className="filter-actions">
                        <button 
                            type="button" 
                            className="btn-filter"
                            onClick={handleApplyFilters}
                        >
                            <i className="fa fa-filter" aria-hidden="true"></i>
                            <span>Apply Filters</span>
                        </button>
                        {activeFilterPills.length > 0 && (
                            <button 
                                type="button" 
                                className="btn-reset-filter"
                                onClick={handleResetFilters}
                                title="Limpiar todos los filtros"
                            >
                                <i className="fa fa-undo" aria-hidden="true"></i>
                                <span>Limpiar Filtros</span>
                            </button>
                        )}
                    </div>

                    {activeFilterPills.length > 0 && (
                        <div className="active-filters-container">
                            <div className="active-filters-header">
                                <span className="active-filters-count">
                                    <i className="fa fa-sliders" aria-hidden="true"></i>
                                    {activeFilterPills.length} {activeFilterPills.length === 1 ? 'filtro activo' : 'filtros activos'}
                                </span>
                                <span className="results-count">
                                    {mangas.length} {mangas.length === 1 ? 'manga encontrado' : 'mangas encontrados'}
                                </span>
                            </div>
                            <div className="active-filters-pills">
                                {activeFilterPills.map(pill => (
                                    <span key={pill.id} className="filter-pill">
                                        {pill.label}
                                        <button type="button" onClick={pill.onRemove} title="Quitar este filtro">
                                            <i className="fa fa-times" aria-hidden="true"></i>
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="filter" style={{ background: 'var(--header-gradient)', color: '#fff', padding: '16px 24px', borderRadius: '10px', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <i className="fa fa-bookmark" aria-hidden="true"></i> Mi Lista de Lectura
                    </h2>
                    {user && (
                        <p style={{ margin: '6px 0 0 0', opacity: 0.9, fontSize: '13px' }}>
                            Mangas guardados para <b>{user.username}</b>
                        </p>
                    )}
                </div>
            )}

            {isMyList && !isAuthenticated ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-primary)' }}>
                    <i className="fa fa-lock" style={{ fontSize: '48px', color: 'var(--main-color)', marginBottom: '16px' }}></i>
                    <h3>Inicia sesión para ver tu lista</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                        Guarda tus mangas favoritos, marca tu progreso de lectura y accede a ellos en cualquier momento.
                    </p>
                    <Link to="/login" className="btn-filter" style={{ display: 'inline-block', width: 'auto', padding: '10px 24px', textDecoration: 'none' }}>
                        Iniciar Sesión
                    </Link>
                </div>
            ) : loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    <i className="fa fa-spinner fa-spin" style={{ fontSize: '32px', marginBottom: '12px' }}></i>
                    <p>Cargando catálogo de mangas...</p>
                </div>
            ) : mangas.length === 0 ? (
                <div className="no-mangas-container">
                    <i className="fa fa-search" style={{ fontSize: '36px', opacity: 0.6, marginBottom: '12px', color: 'var(--main-color)' }}></i>
                    <h3>No se encontraron mangas</h3>
                    <p>Ningún manga coincide con los filtros seleccionados.</p>
                    {activeFilterPills.length > 0 && (
                        <button type="button" className="btn-filter" style={{ width: 'auto', padding: '10px 24px', margin: '0 auto', display: 'inline-flex' }} onClick={handleResetFilters}>
                            <i className="fa fa-undo"></i> Restablecer Filtros
                        </button>
                    )}
                </div>
            ) : (
                <div className="cards-container">
                    <Card mangas={mangas} progressMap={isMyList ? progressMap : null}/>
                </div>
            )}
        </div>
    );
};
 
export default Library;
