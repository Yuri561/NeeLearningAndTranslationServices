import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "../../lib/apiClient";
import { authApi } from "./authApi";
import { tokenStorage } from "./tokenStorage";
import type { LoginInput, RegisterInput } from "./authTypes";

export const authKeys = {
  user: ["auth", "user"] as const,
};

export const useCurrentUser = () =>
  useQuery({
    queryKey: authKeys.user,
    queryFn: async () => {
      try {
        return await authApi.getMe();
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          tokenStorage.clear();
        }
        throw error;
      }
    },
    enabled: Boolean(tokenStorage.get()),
  });

export const useLoginMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      credentials,
      remember,
    }: {
      credentials: LoginInput;
      remember: boolean;
    }) => {
      const token = await authApi.login(credentials);
      tokenStorage.set(token.access_token, remember);
      try {
        return await authApi.getMe();
      } catch (error) {
        tokenStorage.clear();
        throw error;
      }
    },
    onSuccess: (user) => queryClient.setQueryData(authKeys.user, user),
    retry: false,
  });
};

export const useRegisterMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      registration,
      remember = true,
    }: {
      registration: Omit<RegisterInput, "role">;
      remember?: boolean;
    }) => {
      const learnerRegistration: RegisterInput = {
        ...registration,
        role: "learner",
      };
      await authApi.register(learnerRegistration);
      const token = await authApi.login({
        email: registration.email,
        password: registration.password,
      });
      tokenStorage.set(token.access_token, remember);
      try {
        return await authApi.getMe();
      } catch (error) {
        tokenStorage.clear();
        throw error;
      }
    },
    onSuccess: (user) => queryClient.setQueryData(authKeys.user, user),
  });
};

export const useGoogleAuthorizationMutation = () =>
  useMutation({
    mutationFn: authApi.getGoogleAuthorization,
    onSuccess: ({ authorization_url }) => {
      window.location.assign(authorization_url);
    },
  });

export const useChangePasswordMutation = () =>
  useMutation({
    mutationFn: authApi.changePassword,
  });

export const useGoogleCallbackMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      const token = await authApi.exchangeGoogleCode(code);
      tokenStorage.set(token.access_token, true);
      try {
        return await authApi.getMe();
      } catch (error) {
        tokenStorage.clear();
        throw error;
      }
    },
    onSuccess: (user) => queryClient.setQueryData(authKeys.user, user),
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return () => {
    tokenStorage.clear();
    queryClient.removeQueries({ queryKey: authKeys.user });
  };
};

export const useLogoutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      tokenStorage.clear();
      queryClient.removeQueries({ queryKey: authKeys.user });
    },
  });
};
