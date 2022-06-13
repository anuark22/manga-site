import React, {useState, useEffect, useMemo} from 'react';

const SearchBarContext = React.createContext();

export function SearchBarProvider(props){

    const [searchTerm, setSearchTerm] = useState('');

    const value = useMemo(()=>{
        return({
            searchTerm,
            setSearchTerm
        })
    },[searchTerm])
    return <SearchBarContext.Provider value={value} {...props}/>
};

export function useSearchTerm(){
    const context = React.useContext(SearchBarContext);
    if(!context){
        throw new Error('useSearch debe estar dentro del proveeedor');
    }
    return context;
}