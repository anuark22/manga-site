import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'mangasite_lang';

const translations = {
  es: {
    nav: {
      library: 'BIBLIOTECA',
      yourList: 'TU LISTA',
      forum: 'FORO',
      news: 'NOTICIAS',
      panelScan: 'PANEL SCAN',
      panelAdmin: 'PANEL ADMIN',
      login: 'INICIAR SESIÓN',
      register: 'REGISTRARSE',
      logout: 'SALIR',
      searchPlaceholder: 'Buscar mangas...',
      themePastel: 'Claro',
      themeDark: 'Oscuro',
      langTooltip: 'Cambiar idioma a Inglés (EN)'
    },
    home: {
      popularTitle: 'MANGAS POPULARES',
      recentChaptersTitle: 'ÚLTIMOS CAPÍTULOS SUBIDOS',
      recentChaptersSub: 'Mantente al día con los estrenos más recientes de la comunidad',
      noticesTitle: 'NOTICIAS / AVISOS',
      viewAllNews: 'Ver todas las noticias',
      chapterLabel: 'Capítulo',
      readNow: 'Leer ahora',
      noChapters: 'No hay capítulos recientes aún.'
    },
    library: {
      title: 'Biblioteca de Mangas',
      myListTitle: 'Mi Lista Personal',
      applyFilters: 'Aplicar Filtros',
      filtersBtn: 'Filtros',
      genresBtn: 'Géneros',
      typeLabel: 'Tipo',
      demographyLabel: 'Demografía',
      seeAll: 'Ver todo',
      allTypes: '--Todos los Tipos--',
      allDemographics: '--Todas las Demografías--',
      allOption: '--Todos--',
      yes: 'Sí',
      no: 'No',
      clearFilters: 'Limpiar Filtros',
      activeFilters: 'filtro activo',
      activeFiltersPlural: 'filtros activos',
      found: 'manga encontrado',
      foundPlural: 'mangas encontrados',
      loading: 'Cargando catálogo...',
      emptyTitle: 'No se encontraron mangas',
      emptyDesc: 'Prueba ajustando o limpiando tus filtros de búsqueda.',
      myListEmptyTitle: 'Tu lista está vacía',
      myListEmptyDesc: 'Explora la biblioteca y guarda tus mangas favoritos para seguir tu lectura.'
    },
    mangaDetail: {
      backToLibrary: 'Volver a la Biblioteca',
      author: 'Autor',
      status: 'Estado',
      type: 'Tipo',
      demography: 'Demografía',
      synopsis: 'Sinopsis',
      addToList: 'Añadir a Mi Lista',
      inList: 'En Mi Lista',
      chaptersTitle: 'Capítulos Disponibles',
      chapter: 'Capítulo',
      noChapters: 'Aún no hay capítulos publicados para este manga.',
      loading: 'Cargando información del manga...'
    },
    reader: {
      details: 'Detalles',
      zoom: 'Lupa',
      report: 'Reportar',
      reported: 'Reportado',
      prevPage: 'Pág. Anterior',
      nextPage: 'Pág. Siguiente',
      prevChapter: 'Cap. Anterior',
      nextChapter: 'Cap. Siguiente',
      loadingPages: 'Descargando páginas del capítulo...',
      reportTitle: 'Reportar Capítulo',
      reportStatusTitle: 'Estado de tu Reporte',
      reportAntiSpam: 'Solo puedes enviar 1 reporte por capítulo. Úsalo si el capítulo está mal subido, incompleto o pertenece a otro manga.',
      reportReason: 'Motivo del reporte *',
      reportDetails: 'Detalles adicionales (opcional)',
      cancel: 'Cancelar',
      sendReport: 'Enviar Reporte'
    },
    forum: {
      createDiscussion: 'Crear discusión',
      sortBy: 'Ordenar por',
      activeFilter: 'Filtro activo',
      clearFilter: 'Limpiar filtro',
      refreshTitle: 'Actualizar discusiones',
      loadingPosts: 'Cargando discusiones del foro...',
      emptyPosts: 'No se encontraron discusiones en esta categoría',
      comments: 'Comentarios',
      views: 'Vistas',
      newDiscussionTitle: 'Nueva Discusión en el Foro',
      loginRequiredPost: 'Debes haber iniciado sesión para poder publicar.',
      categoryLabel: 'Categoría',
      topicTitleLabel: 'Título del Tema',
      topicTitlePlaceholder: '¿De qué quieres hablar?',
      messageLabel: 'Mensaje',
      messagePlaceholder: 'Escribe los detalles de tu discusión aquí...',
      cancel: 'Cancelar',
      publishing: 'Publicando...',
      publishDiscussion: 'Publicar Discusión',
      backToForum: 'Volver a Discusiones',
      noReplies: 'No hay respuestas aún',
      beFirstReply: 'Sé el primero en compartir tu punto de vista sobre esta discusión.',
      replyingAs: 'Respondiendo como',
      replyNote: 'Participa con respeto y sigue las normas de la comunidad',
      replyPlaceholder: 'Escribe tu comentario o respuesta aquí... Sé constructivo y amable.',
      publishReply: 'Publicar Respuesta',
      loginToComment: 'Inicia sesión para participar en esta discusión',
      deletePost: 'Eliminar discusión',
      chars: 'caracteres',
      sortOptions: {
        Latest: 'Recientes',
        Newer: 'Más nuevos',
        Older: 'Más antiguos',
        Popular: 'Populares',
        Trending: 'Tendencias',
        Discussions: 'Más comentados'
      },
      categories: {
        'OMS Community': 'Comunidad OMS',
        'Library & Mangas': 'Biblioteca y Mangas',
        'Video & Anime': 'Video y Anime',
        'Scanlation Groups': 'Grupos Scanlation'
      },
      subTopics: {
        All: 'Todos',
        General: 'General',
        Release: 'Lanzamientos',
        Announcements: 'Anuncios',
        Suggestions: 'Sugerencias',
        Help: 'Ayuda',
        'Shounen & Action': 'Shounen y Acción',
        'Seinen & Mystery': 'Seinen y Misterio',
        'Romance & Shoujo': 'Romance y Shoujo',
        Recommendations: 'Recomendaciones',
        Reviews: 'Reseñas',
        'Episodes & Stream': 'Episodios y Stream',
        'Movie Adaptations': 'Películas',
        'Trailers & Teasers': 'Tráilers y Avances',
        'Soundtracks & OST': 'Bandas Sonoras / OST',
        Recruitment: 'Reclutamiento',
        'Releases Showcase': 'Nuevos Capítulos',
        'Translators & Editors': 'Traductores y Editores',
        Partnerships: 'Alianzas'
      }
    },
    auth: {
      loginTitle: 'Iniciar Sesión',
      registerTitle: 'Crear Cuenta',
      emailPlaceholder: 'Correo electrónico',
      usernamePlaceholder: 'Nombre de usuario',
      passwordPlaceholder: 'Contraseña',
      confirmPasswordPlaceholder: 'Confirmar contraseña',
      loginBtn: 'Entrar',
      registerBtn: 'Registrarse',
      noAccount: '¿No tienes cuenta?',
      registerHere: 'Regístrate aquí',
      hasAccount: '¿Ya tienes una cuenta?',
      loginHere: 'Inicia sesión'
    },
    chat: {
      title: 'Chat en Vivo',
      online: 'en línea',
      connecting: 'Conectando...',
      empty: 'Sé el primero en saludar a la comunidad en tiempo real.',
      placeholder: 'Escribe un mensaje...',
      mediaUrlPlaceholder: 'Pega URL de imagen o GIF (https://...)',
      addMediaTitle: 'Adjuntar imagen o GIF por URL',
      send: 'Enviar',
      loginPrompt: 'Inicia sesión para chatear en vivo',
      loginBtn: 'Entrar'
    },
    chapterComments: {
      title: 'Comentarios del Capítulo',
      subtitle: 'Comparte tu opinión sobre este capítulo o responde a otros lectores',
      placeholder: '¿Qué te pareció este capítulo? Escribe tu comentario...',
      replyPlaceholder: 'Escribe tu respuesta...',
      uploadMedia: 'Subir Imagen / GIF',
      pasteGifUrl: 'URL de GIF / Imagen',
      pasteUrlPlaceholder: 'https://media.giphy.com/...',
      publish: 'Comentar',
      reply: 'Responder',
      sending: 'Enviando...',
      delete: 'Eliminar',
      deleteConfirm: '¿Seguro que deseas eliminar este comentario?',
      empty: 'Aún no hay comentarios en este capítulo. ¡Sé el primero en opinar!',
      loginPrompt: 'Inicia sesión para comentar o responder con imágenes/GIFs',
      collapseThread: 'Ocultar hilo',
      expandThread: 'Mostrar hilo'
    },
    news: {
      badge: 'Actualidad & Novedades',
      title: 'Noticias del Mundo Manga & Anime',
      subtitle: 'Descubre los lanzamientos más recientes, comunicados oficiales de autores, récords de ventas y adaptaciones animadas de la comunidad.',
      publishBtn: 'Publicar Noticia',
      allCategories: 'Todas',
      catManga: 'Manga',
      catAnime: 'Anime',
      catCommunity: 'Comunidad',
      catReleases: 'Lanzamientos',
      searchPlaceholder: 'Buscar noticias por título o contenido...',
      loading: 'Cargando noticias y actualizaciones...',
      emptyTitle: 'No se encontraron noticias',
      emptySub: 'Intenta con otros términos de búsqueda o cambia la categoría seleccionada.',
      clearSearch: 'Limpiar búsqueda',
      featured: 'Destacada',
      readFull: 'Leer Noticia Completa',
      readMore: 'Leer más',
      moreRecent: 'Más Noticias Recientes',
      deleteTitle: 'Eliminar noticia',
      delete: 'Eliminar',
      backToNews: 'Volver a todas las noticias',
      publishedBy: 'Publicado por',
      clickToZoom: 'Clic para ampliar imagen',
      defaultCaption: 'Imagen oficial del lanzamiento / anuncio',
      illustrations: 'Ilustraciones y Capturas Relacionadas',
      zoomTag: 'Ampliar',
      shareNews: 'Compartir Noticia',
      linkCopied: '¡Enlace de la noticia copiado al portapapeles!',
      viewAll: 'Ver todas las noticias',
      otherNews: 'Otras Noticias que te Pueden Interesar',
      modalTitle: 'Publicar Nueva Noticia',
      modalTitleLabel: 'Título de la Noticia *',
      modalTitlePlaceholder: 'Ej. Temporada 3 de Jujutsu Kaisen anunciada oficialmente',
      modalCategory: 'Categoría',
      modalCover: 'Imagen de Portada (Opcional)',
      modalPreview: 'Vista previa de la imagen seleccionada',
      modalContentLabel: 'Cuerpo / Contenido de la Noticia *',
      modalContentPlaceholder: 'Escribe la información detallada de la noticia...',
      cancel: 'Cancelar',
      publishing: 'Publicando...',
      publishSubmit: 'Publicar Noticia',
      closeZoom: 'Cerrar vista ampliada',
      recentDate: 'Fecha reciente',
      recentShort: 'Reciente'
    }
  },
  en: {
    nav: {
      library: 'LIBRARY',
      yourList: 'YOUR LIST',
      forum: 'FORUM',
      news: 'NEWS',
      panelScan: 'SCAN PANEL',
      panelAdmin: 'ADMIN PANEL',
      login: 'LOGIN',
      register: 'REGISTER',
      logout: 'LOGOUT',
      searchPlaceholder: 'Search mangas...',
      themePastel: 'Light',
      themeDark: 'Dark',
      langTooltip: 'Switch language to Spanish (ES)'
    },
    home: {
      popularTitle: 'POPULAR MANGA TIER',
      recentChaptersTitle: 'LATEST CHAPTERS UPLOADED',
      recentChaptersSub: 'Stay up to date with the newest community releases',
      noticesTitle: 'NOTICES / NEWS',
      viewAllNews: 'View all news',
      chapterLabel: 'Chapter',
      readNow: 'Read now',
      noChapters: 'No recent chapters available yet.'
    },
    library: {
      title: 'Manga Library',
      myListTitle: 'My Reading List',
      applyFilters: 'Apply Filters',
      filtersBtn: 'Filters',
      genresBtn: 'Genres',
      typeLabel: 'Type',
      demographyLabel: 'Demography',
      seeAll: 'See all',
      allTypes: '--All Types--',
      allDemographics: '--All Demographics--',
      allOption: '--All--',
      yes: 'Yes',
      no: 'No',
      clearFilters: 'Clear Filters',
      activeFilters: 'active filter',
      activeFiltersPlural: 'active filters',
      found: 'manga found',
      foundPlural: 'mangas found',
      loading: 'Loading catalog...',
      emptyTitle: 'No mangas found',
      emptyDesc: 'Try adjusting or clearing your search filters.',
      myListEmptyTitle: 'Your list is empty',
      myListEmptyDesc: 'Explore the library and bookmark your favorite series to track your reading.'
    },
    mangaDetail: {
      backToLibrary: 'Back to Library',
      author: 'Author',
      status: 'Status',
      type: 'Type',
      demography: 'Demographic',
      synopsis: 'Synopsis',
      addToList: 'Add to My List',
      inList: 'In My List',
      chaptersTitle: 'Available Chapters',
      chapter: 'Chapter',
      noChapters: 'No chapters published for this manga yet.',
      loading: 'Loading manga details...'
    },
    reader: {
      details: 'Details',
      zoom: 'Zoom',
      report: 'Report',
      reported: 'Reported',
      prevPage: 'Prev. Page',
      nextPage: 'Next Page',
      prevChapter: 'Prev. Chapter',
      nextChapter: 'Next Chapter',
      loadingPages: 'Loading chapter pages...',
      reportTitle: 'Report Chapter',
      reportStatusTitle: 'Your Report Status',
      reportAntiSpam: 'You can only submit 1 report per chapter. Use it if the chapter is misuploaded, broken, or belongs to another series.',
      reportReason: 'Report reason *',
      reportDetails: 'Additional details (optional)',
      cancel: 'Cancel',
      sendReport: 'Submit Report'
    },
    forum: {
      createDiscussion: 'Create discussion',
      sortBy: 'Sort by',
      activeFilter: 'Active filter',
      clearFilter: 'Clear filter',
      refreshTitle: 'Refresh discussions',
      loadingPosts: 'Loading forum discussions...',
      emptyPosts: 'No discussions found in this category',
      comments: 'Comments',
      views: 'Views',
      newDiscussionTitle: 'New Forum Discussion',
      loginRequiredPost: 'You must be logged in to publish a topic.',
      categoryLabel: 'Category',
      topicTitleLabel: 'Topic Title',
      topicTitlePlaceholder: 'What would you like to talk about?',
      messageLabel: 'Message',
      messagePlaceholder: 'Write the details of your discussion here...',
      cancel: 'Cancel',
      publishing: 'Publishing...',
      publishDiscussion: 'Publish Discussion',
      backToForum: 'Back to Discussions',
      noReplies: 'No replies yet',
      beFirstReply: 'Be the first to share your thoughts on this discussion.',
      replyingAs: 'Replying as',
      replyNote: 'Participate respectfully and follow community guidelines',
      replyPlaceholder: 'Write your comment or reply here... Be constructive and respectful.',
      publishReply: 'Post Reply',
      loginToComment: 'Log in to join this discussion',
      deletePost: 'Delete discussion',
      chars: 'characters',
      sortOptions: {
        Latest: 'Latest',
        Newer: 'Newer',
        Older: 'Older',
        Popular: 'Popular',
        Trending: 'Trending',
        Discussions: 'Discussions'
      },
      categories: {
        'OMS Community': 'OMS Community',
        'Library & Mangas': 'Library & Mangas',
        'Video & Anime': 'Video & Anime',
        'Scanlation Groups': 'Scanlation Groups'
      },
      subTopics: {
        All: 'All',
        General: 'General',
        Release: 'Release',
        Announcements: 'Announcements',
        Suggestions: 'Suggestions',
        Help: 'Help',
        'Shounen & Action': 'Shounen & Action',
        'Seinen & Mystery': 'Seinen & Mystery',
        'Romance & Shoujo': 'Romance & Shoujo',
        Recommendations: 'Recommendations',
        Reviews: 'Reviews',
        'Episodes & Stream': 'Episodes & Stream',
        'Movie Adaptations': 'Movie Adaptations',
        'Trailers & Teasers': 'Trailers & Teasers',
        'Soundtracks & OST': 'Soundtracks & OST',
        Recruitment: 'Recruitment',
        'Releases Showcase': 'Releases Showcase',
        'Translators & Editors': 'Translators & Editors',
        Partnerships: 'Partnerships'
      }
    },
    auth: {
      loginTitle: 'Sign In',
      registerTitle: 'Create Account',
      emailPlaceholder: 'Email address',
      usernamePlaceholder: 'Username',
      passwordPlaceholder: 'Password',
      confirmPasswordPlaceholder: 'Confirm password',
      loginBtn: 'Login',
      registerBtn: 'Register',
      noAccount: "Don't have an account?",
      registerHere: 'Register here',
      hasAccount: 'Already have an account?',
      loginHere: 'Sign in'
    },
    chat: {
      title: 'Live Chat',
      online: 'online',
      connecting: 'Connecting...',
      empty: 'Be the first to say hello to the community in real time.',
      placeholder: 'Write a message...',
      mediaUrlPlaceholder: 'Paste image or GIF URL (https://...)',
      addMediaTitle: 'Attach image or GIF by URL',
      send: 'Send',
      loginPrompt: 'Log in to join the live chat',
      loginBtn: 'Sign in'
    },
    chapterComments: {
      title: 'Chapter Comments',
      subtitle: 'Share your thoughts on this chapter or reply to other readers',
      placeholder: 'What did you think of this chapter? Leave a comment...',
      replyPlaceholder: 'Write your reply...',
      uploadMedia: 'Upload Image / GIF',
      pasteGifUrl: 'GIF / Image URL',
      pasteUrlPlaceholder: 'https://media.giphy.com/...',
      publish: 'Post Comment',
      reply: 'Reply',
      sending: 'Posting...',
      delete: 'Delete',
      deleteConfirm: 'Are you sure you want to delete this comment?',
      empty: 'No comments on this chapter yet. Be the first to share your thoughts!',
      loginPrompt: 'Log in to comment or reply with images/GIFs',
      collapseThread: 'Collapse thread',
      expandThread: 'Expand thread'
    },
    news: {
      badge: 'Latest News & Updates',
      title: 'Manga & Anime World News',
      subtitle: 'Discover the latest releases, official author announcements, sales records, and anime adaptations from the community.',
      publishBtn: 'Publish News',
      allCategories: 'All',
      catManga: 'Manga',
      catAnime: 'Anime',
      catCommunity: 'Community',
      catReleases: 'Releases',
      searchPlaceholder: 'Search news by title or content...',
      loading: 'Loading news and updates...',
      emptyTitle: 'No news found',
      emptySub: 'Try other search terms or change the selected category.',
      clearSearch: 'Clear search',
      featured: 'Featured',
      readFull: 'Read Full Article',
      readMore: 'Read more',
      moreRecent: 'More Recent News',
      deleteTitle: 'Delete news',
      delete: 'Delete',
      backToNews: 'Back to all news',
      publishedBy: 'Published by',
      clickToZoom: 'Click to enlarge image',
      defaultCaption: 'Official release / announcement image',
      illustrations: 'Related Illustrations & Screenshots',
      zoomTag: 'Zoom',
      shareNews: 'Share Article',
      linkCopied: 'Article link copied to clipboard!',
      viewAll: 'View all news',
      otherNews: 'Other News You May Like',
      modalTitle: 'Publish New Article',
      modalTitleLabel: 'Article Title *',
      modalTitlePlaceholder: 'E.g. Jujutsu Kaisen Season 3 officially announced',
      modalCategory: 'Category',
      modalCover: 'Cover Image (Optional)',
      modalPreview: 'Selected image preview',
      modalContentLabel: 'Article Body / Content *',
      modalContentPlaceholder: 'Write the detailed news information...',
      cancel: 'Cancel',
      publishing: 'Publishing...',
      publishSubmit: 'Publish Article',
      closeZoom: 'Close enlarged view',
      recentDate: 'Recent date',
      recentShort: 'Recent'
    }
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'en' || saved === 'es') return saved;
      if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('en')) {
        return 'en';
      }
    } catch {
      // Fallback
    }
    return 'es';
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Ignorar errores de almacenamiento
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const setLanguage = useCallback((lang) => {
    if (lang === 'en' || lang === 'es') {
      setLanguageState(lang);
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => (prev === 'es' ? 'en' : 'es'));
  }, []);

  const t = useCallback((path, fallback = '') => {
    const keys = path.split('.');
    let current = translations[language] || translations.es;
    for (const k of keys) {
      if (current && Object.prototype.hasOwnProperty.call(current, k)) {
        current = current[k];
      } else {
        return fallback || path;
      }
    }
    return typeof current === 'string' ? current : (fallback || path);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage debe ser usado dentro de un LanguageProvider');
  }
  return ctx;
};

export default LanguageContext;
