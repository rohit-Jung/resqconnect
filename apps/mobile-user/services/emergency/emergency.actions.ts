import {
  useCancelEmergencyRequest,
  useCompleteEmergencyRequest,
  useConfirmProviderArrival,
} from './emergency.api';

export const useEmergencyActions = () => {
  const cancelMutation = useCancelEmergencyRequest();
  const confirmArrivalMutation = useConfirmProviderArrival();
  const completeMutation = useCompleteEmergencyRequest();

  const cancelRequest = async (requestId: string) => {
    return cancelMutation.mutateAsync(requestId);
  };

  const confirmArrival = async (requestId: string) => {
    return confirmArrivalMutation.mutateAsync(requestId);
  };

  const completeRequest = async (requestId: string) => {
    return completeMutation.mutateAsync(requestId);
  };

  return {
    cancelRequest,
    confirmArrival,
    completeRequest,

    isCancelling: cancelMutation.isPending,
    isConfirmingArrival: confirmArrivalMutation.isPending,
    isCompleting: completeMutation.isPending,
  };
};
