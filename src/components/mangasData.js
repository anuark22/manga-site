import img1 from '../styles/img/bokunohero.jpg';
import img2 from '../styles/img/talesofdemon.jpg';
import img3 from '../styles/img/sololeveling.jpg';
import img4 from '../styles/img/blackclover.jpg';
import img5 from '../styles/img/nanatsu.jpg';

export const canonicalMangas = [
  {
    id: 'boku-no-hero',
    mangaImage: img1,
    mangaName: 'BOKU NO HERO',
    mangaType: 'MANGA',
    mangaDemography: 'SHOUNEN',
    card: 'card',
    author: 'Kohei Horikoshi',
    rating: '4.8',
    status: 'Publishing',
    synopsis: 'En un mundo donde el 80% de la población nace con dones sobrenaturales, Izuku Midoriya nace sin poderes pero sueña con convertirse en el mejor héroe. Todo cambia tras conocer al héroe número uno, All Might.',
    chapters: [
      { number: 1, title: 'Izuku Midoriya: Origen', releaseDate: '2024-01-10' },
      { number: 2, title: 'Rugido en el examen', releaseDate: '2024-01-17' },
      { number: 3, title: 'Línea de salida', releaseDate: '2024-01-24' },
      { number: 4, title: 'Entrenamiento de combate', releaseDate: '2024-01-31' },
      { number: 5, title: '¡Furia, idiota!', releaseDate: '2024-02-07' }
    ]
  },
  {
    id: 'tales-of-demons-and-gods',
    mangaImage: img2,
    mangaName: 'TALES OF DEMONS AND GODS',
    mangaType: 'MANHUA',
    mangaDemography: 'SHOUNEN',
    card: 'card',
    author: 'Mad Snail',
    rating: '4.7',
    status: 'Publishing',
    synopsis: 'Nie Li, el más fuerte espiritista demoníaco, reencarna a sus 13 años conservando todos sus recuerdos tras ser asesinado por el Sabio Emperador. Ahora tiene una nueva oportunidad para proteger a su ciudad y a sus seres queridos.',
    chapters: [
      { number: 1, title: 'Renacimiento', releaseDate: '2024-01-12' },
      { number: 2, title: 'La clase de la Maestra Shen', releaseDate: '2024-01-19' },
      { number: 3, title: 'Apuesta en el aula', releaseDate: '2024-01-26' },
      { number: 4, title: 'Refinamiento de Alma', releaseDate: '2024-02-02' }
    ]
  },
  {
    id: 'solo-leveling',
    mangaImage: img3,
    mangaName: 'SOLO LEVELING',
    mangaType: 'MANHWA',
    mangaDemography: 'SEINEN',
    card: 'card',
    author: 'Chugong / DUBU',
    rating: '4.9',
    status: 'Finished',
    synopsis: 'Conocido como el cazador más débil de la humanidad, Sung Jin-woo se encuentra al borde de la muerte dentro de una misteriosa mazmorra doble. Al despertar, obtiene acceso a un sistema de registro que solo él puede ver.',
    chapters: [
      { number: 1, title: 'El cazador más débil de rango E', releaseDate: '2024-01-05' },
      { number: 2, title: 'La doble mazmorra', releaseDate: '2024-01-12' },
      { number: 3, title: 'Los mandamientos del templo', releaseDate: '2024-01-19' },
      { number: 4, title: 'Misión diaria: Despertar', releaseDate: '2024-01-26' },
      { number: 5, title: 'Nivel 1 al infinito', releaseDate: '2024-02-02' }
    ]
  },
  {
    id: 'nanatsu-no-taizai',
    mangaImage: img5,
    mangaName: 'NANATSU NO TAIZAI',
    mangaType: 'MANGA',
    mangaDemography: 'SEINEN',
    card: 'card',
    author: 'Nakaba Suzuki',
    rating: '4.6',
    status: 'Finished',
    synopsis: 'Los Siete Pecados Capitales, una legendaria orden de caballeros acusados de conspirar contra el reino, se dispersaron. La princesa Elizabeth emprende un viaje para encontrarlos y salvar a Britania de la tiranía de los Caballeros Sagrados.',
    chapters: [
      { number: 1, title: 'Los Siete Pecados Capitales', releaseDate: '2024-01-08' },
      { number: 2, title: 'La espada del Caballero Sagrado', releaseDate: '2024-01-15' },
      { number: 3, title: 'El bosque del sueño blanco', releaseDate: '2024-01-22' },
      { number: 4, title: 'El pecado de la envidia', releaseDate: '2024-01-29' }
    ]
  },
  {
    id: 'black-clover',
    mangaImage: img4,
    mangaName: 'BLACK CLOVER',
    mangaType: 'MANGA',
    mangaDemography: 'SHOUJO',
    card: 'card',
    author: 'Yūki Tabata',
    rating: '4.7',
    status: 'Publishing',
    synopsis: 'Asta y Yuno fueron abandonados en la misma iglesia el mismo día. Criados juntos, supieron del Rey Mago y juraron competir por el trono. Pero mientras Yuno es un prodigio mágico, Asta nació sin magia alguna.',
    chapters: [
      { number: 1, title: 'El juramento de los chicos', releaseDate: '2024-01-11' },
      { number: 2, title: 'El examen de ingreso a los Caballeros Mágicos', releaseDate: '2024-01-18' },
      { number: 3, title: 'Hacia la capital real', releaseDate: '2024-01-25' },
      { number: 4, title: 'El grimorio del trébol de cinco hojas', releaseDate: '2024-02-01' }
    ]
  }
];

// Genera una lista más larga para la sección de biblioteca
const mangasData = [
  ...canonicalMangas,
  ...canonicalMangas.map((m, index) => ({ ...m, id: `${m.id}-alt-${index + 1}` })),
  ...canonicalMangas.map((m, index) => ({ ...m, id: `${m.id}-extra-${index + 1}` })),
  ...canonicalMangas.map((m, index) => ({ ...m, id: `${m.id}-plus-${index + 1}` }))
];

export default mangasData;
