import { useQuery } from '@tanstack/react-query';

import api from '../axiosInstance';

export const useGetSilos = () =>
  useQuery({
    queryKey: ['adminSilos'],
    queryFn: () => api.get('/internal/silos'),
  });

export const useGetActiveSilos = () =>
  useQuery({
    queryKey: ['adminSilosActive'],
    queryFn: () => api.get('/internal/silos/active'),
  });
