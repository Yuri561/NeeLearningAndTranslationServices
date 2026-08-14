import { useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentApi } from "./paymentApi";

export const useCreatePayPalOrder = () =>
  useMutation({ mutationFn: paymentApi.createPayPalOrder });

export const useCapturePayPalOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: paymentApi.capturePayPalOrder,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["learner"] }),
        queryClient.invalidateQueries({ queryKey: ["tutor"] }),
        queryClient.invalidateQueries({ queryKey: ["admin"] }),
      ]);
    },
  });
};

