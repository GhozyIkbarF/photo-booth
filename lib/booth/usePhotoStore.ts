'use client';
import { useCallback, useState } from 'react';
import type { Photo } from './constants';

export function usePhotoStore() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<number[]>([]);

  const addPhoto = useCallback((photo: Photo) => {
    setPhotos(prev => [...prev, photo]);
  }, []);

  const deletePhoto = useCallback((id: number) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
    setSelectedPhotoIds(prev => prev.filter(x => x !== id));
  }, []);

  const clearAll = useCallback(() => {
    setPhotos([]);
    setSelectedPhotoIds([]);
  }, []);

  const toggleSelect = useCallback((id: number) => {
    setSelectedPhotoIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedPhotoIds([]);
  }, []);

  const getSelectedPhotos = useCallback(
    (all: Photo[]) =>
      selectedPhotoIds.length > 0
        ? all.filter(p => selectedPhotoIds.includes(p.id))
        : all,
    [selectedPhotoIds],
  );

  return {
    photos,
    selectedPhotoIds,
    addPhoto,
    deletePhoto,
    clearAll,
    toggleSelect,
    clearSelection,
    getSelectedPhotos,
  };
}
