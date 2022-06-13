import { v4 as uuidv4 } from 'uuid';
import img1 from '../styles/img/bokunohero.jpg';
import img2 from '../styles/img/talesofdemon.jpg';
import img3 from '../styles/img/sololeveling.jpg';
import img4 from '../styles/img/blackclover.jpg';
import img5 from '../styles/img/nanatsu.jpg';

const mangasData = [
    { id: uuidv4(), mangaImage: img1, mangaName: 'BOKU NO HERO', mangaType: 'MANGA', mangaDemography: 'SHOUNEN', card:'card', synopsis: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Soluta dolorum voluptas enim nemo possimus, suscipit facilis nobis ullam eaque dignissimos ab nisi laudantium cum sunt ut sed iusto. Dolorum, et.' },
    { id: uuidv4(), mangaImage: img2, mangaName: 'TALES OF DEMONS AND GODS', mangaType: 'MANHUA', mangaDemography: 'SHOUNEN', card:'card', synopsis: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Soluta dolorum voluptas enim nemo possimus, suscipit facilis nobis ullam eaque dignissimos ab nisi laudantium cum sunt ut sed iusto. Dolorum, et.'    },
    { id: uuidv4(), mangaImage: img3, mangaName: 'SOLO LEVELING', mangaType: 'MANHWA', mangaDemography: 'SEINEN', card:'card', synopsis: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Soluta dolorum voluptas enim nemo possimus, suscipit facilis nobis ullam eaque dignissimos ab nisi laudantium cum sunt ut sed iusto. Dolorum, et.'  },
    { id: uuidv4(), mangaImage: img5, mangaName: 'NANATSU NO TAISAI', mangaType: 'MANGA', mangaDemography: 'SEINEN', card:'card', synopsis: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Soluta dolorum voluptas enim nemo possimus, suscipit facilis nobis ullam eaque dignissimos ab nisi laudantium cum sunt ut sed iusto. Dolorum, et.'   },
    { id: uuidv4(), mangaImage: img4, mangaName: 'BLACK CLOVER', mangaType: 'MANGA' , mangaDemography: 'SHOUJO', card:'card', synopsis: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Soluta dolorum voluptas enim nemo possimus, suscipit facilis nobis ullam eaque dignissimos ab nisi laudantium cum sunt ut sed iusto. Dolorum, et.'  },
  ]
  export default mangasData;