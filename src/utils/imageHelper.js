import sololevelingImg from '../styles/img/sololeveling.jpg';
import bokunoheroImg from '../styles/img/bokunohero.jpg';
import blackcloverImg from '../styles/img/blackclover.jpg';
import nanatsuImg from '../styles/img/nanatsu.jpg';
import talesofdemonImg from '../styles/img/talesofdemon.jpg';
import notice1Img from '../styles/img/notice1.webp';

const localMangaMap = {
  'solo-leveling': sololevelingImg,
  'sololeveling': sololevelingImg,
  'solo leveling': sololevelingImg,
  'boku-no-hero': bokunoheroImg,
  'bokunohero': bokunoheroImg,
  'boku no hero': bokunoheroImg,
  'my hero academia': bokunoheroImg,
  'black-clover': blackcloverImg,
  'blackclover': blackcloverImg,
  'black clover': blackcloverImg,
  'nanatsu-no-taizai': nanatsuImg,
  'nanatsu': nanatsuImg,
  'nanatsu no taizai': nanatsuImg,
  'seven deadly sins': nanatsuImg,
  'tales-of-demons-and-gods': talesofdemonImg,
  'talesofdemon': talesofdemonImg,
  'tales of demons and gods': talesofdemonImg
};

/**
 * Resuelve la imagen del manga con fallback a los assets empaquetados
 */
export function getMangaImage(manga) {
  if (!manga) return sololevelingImg;
  const rawUrl = manga.mangaImage || manga.mangaFrontImgUrl;
  const title = (manga.mangaName || manga.mangaTittle || '').toLowerCase();
  const rawLower = (typeof rawUrl === 'string' ? rawUrl : '').toLowerCase();

  // 1. Primero verificar si coincide con los mangas canónicos de muestra locales por título o nombre de archivo
  for (const [key, img] of Object.entries(localMangaMap)) {
    if (title.includes(key) || rawLower.includes(key.replace(/\s+/g, '')) || rawLower.includes(key)) {
      return img;
    }
  }

  // 2. Si la API proporciona una URL hacia /Files/ (ej. Bleach u otros mangas subidos al backend)
  if (rawUrl && typeof rawUrl === 'string') {
    if (rawUrl.includes('/Files/')) {
      const fileName = rawUrl.split('/Files/')[1];
      return `/Files/${fileName}`;
    }
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      return rawUrl;
    }
  }

  return sololevelingImg;
}

/**
 * Resuelve la imagen de noticias con fallback
 */
export function getNoticeImage(notice) {
  if (!notice) return notice1Img;
  const rawUrl = notice.imageUrl || notice.noticeImgUrl;
  if (rawUrl && typeof rawUrl === 'string') {
    if (rawUrl.includes('/Files/')) {
      const fileName = rawUrl.split('/Files/')[1];
      return `/Files/${fileName}`;
    }
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      return rawUrl;
    }
  }
  return notice1Img;
}

export default {
  getMangaImage,
  getNoticeImage,
  defaultManga: sololevelingImg,
  defaultNotice: notice1Img
};
