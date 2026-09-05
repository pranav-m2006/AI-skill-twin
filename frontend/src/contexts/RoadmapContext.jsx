import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../shared/api';
import { useAuth } from './AuthContext';

const RoadmapContext = createContext(null);

export function RoadmapProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [roadmaps, setRoadmaps] = useState([]);
  const [activeRoadmap, setActiveRoadmap] = useState(null);
  const [activeRoadmapId, setActiveRoadmapIdState] = useState(() => {
    return localStorage.getItem('placemate_active_roadmap_id') || null;
  });
  const [loading, setLoading] = useState(false);

  const selectRoadmap = useCallback(async (id) => {
    if (!id) {
      setActiveRoadmap(null);
      setActiveRoadmapIdState(null);
      localStorage.removeItem('placemate_active_roadmap_id');
      return;
    }

    const strId = String(id);
    setActiveRoadmapIdState(strId);
    localStorage.setItem('placemate_active_roadmap_id', strId);

    try {
      const { data } = await api.get(`/roadmap/${strId}`);
      setActiveRoadmap(data);
      return data;
    } catch (e) {
      console.warn('Failed to fetch active roadmap details:', e);
      return null;
    }
  }, []);

  const fetchMyRoadmaps = useCallback(async () => {
    if (!isAuthenticated) {
      setRoadmaps([]);
      setActiveRoadmap(null);
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.get('/roadmap/my');
      setRoadmaps(data || []);

      if (data && data.length > 0) {
        const savedId = localStorage.getItem('placemate_active_roadmap_id');
        const targetId = savedId && data.some(r => String(r.id) === String(savedId))
          ? savedId
          : data[0].id;

        await selectRoadmap(targetId);
      } else {
        setActiveRoadmap(null);
        setActiveRoadmapIdState(null);
      }
    } catch (e) {
      console.warn('Failed to load my roadmaps:', e);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, selectRoadmap]);

  useEffect(() => {
    fetchMyRoadmaps();
  }, [fetchMyRoadmaps]);

  const toggleTaskCompletion = useCallback(async (taskId, isCompleted) => {
    try {
      const { data } = await api.post(`/roadmap/task/${taskId}/complete`, { isCompleted });
      if (activeRoadmapId) {
        await selectRoadmap(activeRoadmapId);
      }
      return data;
    } catch (e) {
      console.warn('Failed to toggle task completion:', e);
      return null;
    }
  }, [activeRoadmapId, selectRoadmap]);

  return (
    <RoadmapContext.Provider
      value={{
        roadmaps,
        setRoadmaps,
        activeRoadmap,
        setActiveRoadmap,
        activeRoadmapId,
        selectRoadmap,
        toggleTaskCompletion,
        fetchMyRoadmaps,
        loading,
      }}
    >
      {children}
    </RoadmapContext.Provider>
  );
}

export function useRoadmap() {
  const context = useContext(RoadmapContext);
  if (!context) {
    throw new Error('useRoadmap must be used within a RoadmapProvider');
  }
  return context;
}
