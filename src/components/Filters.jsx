import React, { useState, useEffect } from 'react';
import { useClickOutside } from '../hooks/useClickOutside';
import { filtersApi } from '../services/api';

const Filter = ({ filterValues = {}, onFilterChange }) => {    
    const [isOpen, setIsOpen] = useState(false);
    const [types, setTypes] = useState([
        { mangaTypeId: 1, mangaTypeName: 'Manga' },
        { mangaTypeId: 2, mangaTypeName: 'Manhwa' },
        { mangaTypeId: 3, mangaTypeName: 'Manhua' }
    ]);
    const [demographics, setDemographics] = useState([
        { demographyId: 1, name: 'Shounen' },
        { demographyId: 2, name: 'Seinen' },
        { demographyId: 3, name: 'Shoujo' },
        { demographyId: 4, name: 'Josei' }
    ]);

    useEffect(() => {
        let isMounted = true;
        Promise.all([
            filtersApi.getMangasType().catch(() => []),
            filtersApi.getDemographics().catch(() => [])
        ]).then(([typesData, demoData]) => {
            if (isMounted) {
                if (typesData && typesData.length > 0) setTypes(typesData);
                if (demoData && demoData.length > 0) setDemographics(demoData);
            }
        });
        return () => { isMounted = false; };
    }, []);

    // Cierra el menú al hacer clic fuera
    const filterRef = useClickOutside(() => {
        if (isOpen) setIsOpen(false);
    });

    const toggleFilters = () => {
        setIsOpen(prev => !prev);
    };

    const handleChange = (field, value) => {
        if (onFilterChange) {
            onFilterChange(field, value);
        }
    };

    const activeCount = [
        filterValues.mangaTypeId,
        filterValues.demographyId,
        filterValues.isAmateur,
        filterValues.isErotic
    ].filter(v => v !== undefined && v !== '').length;

    return (
        <div className="filter-section" ref={filterRef}>
            <button 
                type="button" 
                className="filter-input" 
                onClick={toggleFilters} 
                id="FilterHam" 
            >
                <i className="fa fa-sliders" aria-hidden="true"></i>
                <span>Filters / Filtros {activeCount > 0 ? `(${activeCount})` : ''}</span>
                <i className={`fa ${isOpen ? 'fa-angle-up' : 'fa-angle-down'} filter-chevron`} aria-hidden="true"></i>
            </button>
            <div className="filter-list" style={{ display: isOpen ? 'flex' : 'none' }}>
                <div className="filter-item">
                    <div className="filter-item-content">
                        <h3>Type</h3>
                        <div>
                            <label htmlFor="mangaType">See all</label>
                            <select 
                                id="mangaType" 
                                name="mangaType"
                                value={filterValues.mangaTypeId || ''}
                                onChange={(e) => handleChange('mangaTypeId', e.target.value)}
                            >
                                <option value="">--Todos los Tipos--</option>
                                {types.map(t => (
                                    <option key={t.mangaTypeId} value={t.mangaTypeId}>
                                        {t.mangaTypeName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="filter-item-content">
                        <h3>Demography</h3>
                        <div>
                            <label htmlFor="demography">See all</label>
                            <select 
                                id="demography" 
                                name="demography"
                                value={filterValues.demographyId || ''}
                                onChange={(e) => handleChange('demographyId', e.target.value)}
                            >
                                <option value="">--Todas las Demografías--</option>
                                {demographics.map(d => (
                                    <option key={d.demographyId} value={d.demographyId}>
                                        {d.name || d.demographyName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="filter-item-content">
                        <h3>Amateur</h3>
                        <div>
                            <label htmlFor="amateur">See all</label>
                            <select 
                                id="amateur" 
                                name="amateur"
                                value={filterValues.isAmateur ?? ''}
                                onChange={(e) => handleChange('isAmateur', e.target.value)}
                            >
                                <option value="">--Todos--</option>
                                <option value="false">No</option>
                                <option value="true">Sí</option>
                            </select>
                        </div>
                    </div>
                    <div className="filter-item-content">
                        <h3>Erotic</h3>
                        <div>
                            <label htmlFor="erotic">See all</label>
                            <select 
                                id="erotic" 
                                name="erotic"
                                value={filterValues.isErotic ?? ''}
                                onChange={(e) => handleChange('isErotic', e.target.value)}
                            >
                                <option value="">--Todos--</option>
                                <option value="false">No</option>
                                <option value="true">Sí</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>     
    );
};
 
export default Filter;
