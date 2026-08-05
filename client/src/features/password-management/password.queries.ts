import { useMutation } from "@tanstack/react-query";
import { passwordService } from "./password.service";

export const useForgotPasswordMutation = () =>
  useMutation({ mutationFn: passwordService.forgotPassword });

export const useResetPasswordMutation = () =>
  useMutation({ mutationFn: passwordService.resetPassword });

export const useChangePasswordMutation = () =>
  useMutation({ mutationFn: passwordService.changePassword });

