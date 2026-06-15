import type { ApiResponse } from '@repo/types/api/responses';
import { useMutation } from '@tanstack/react-query';

import api from '../axiosInstance';
import { feedbackEndpoints } from '../endPoints';

interface CreateFeedbackPayload {
  serviceProviderId: string;
  message: string;
  serviceRatings: number;
}

export const useCreateFeedback = () => {
  return useMutation<
    ApiResponse<{ feedback: { id: string } }>,
    Error,
    CreateFeedbackPayload
  >({
    mutationFn: async data => {
      const res = await api.post(feedbackEndpoints.create, data);
      return res.data;
    },
  });
};
