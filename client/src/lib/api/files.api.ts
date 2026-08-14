import { API_BASE_PATH } from "../../config/api";
import { tokenStorage } from "../../features/auth/tokenStorage";
import { API_URL, ApiError, apiRequest } from "../apiClient";
import type { AdminFile, AdminTranslationRequest } from "../../types/adminApi";
import { normalizeFile, normalizeTranslationRequest, unwrapList } from "./responseAdapters";

const getErrorMessage = async (response: Response) => {
  const body = await response.json().catch(() => undefined);
  if (body && typeof body === "object" && "detail" in body) {
    const detail = (body as { detail?: unknown }).detail;
    if (typeof detail === "string") return detail;
  }
  return `Request failed with status ${response.status}.`;
};

const fileNameFromDisposition = (value: string | null) => {
  if (!value) return undefined;
  const match = value.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
};

const requestFileOrMetadata = async (path: string): Promise<AdminFile> => {
  const token = tokenStorage.get();
  if (!token) throw new ApiError("You are not authenticated.", 401);

  const response = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new ApiError(await getErrorMessage(response), response.status);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return normalizeFile(await response.json());
  }

  const blob = await response.blob();
  return normalizeFile({
    file_name: fileNameFromDisposition(response.headers.get("content-disposition")),
    file_type: contentType || blob.type,
    file_size: blob.size,
    file_url: URL.createObjectURL(blob),
  });
};

export const filesApi = {
  getTranslationRequests: async (): Promise<AdminTranslationRequest[]> => {
    const response = await apiRequest<unknown>(
      `${API_BASE_PATH}/translation-requests`,
      {},
      true
    );
    return unwrapList(response).map(normalizeTranslationRequest);
  },

  getUploadById: async (fileId: number | string): Promise<AdminFile> => {
    return requestFileOrMetadata(
      `${API_BASE_PATH}/files/${encodeURIComponent(String(fileId))}`
    );
  },

  getByTranslationRequest: async (
    translationRequestId: number | string
  ): Promise<AdminFile[]> => {
    try {
      const response = await apiRequest<unknown>(
        `${API_BASE_PATH}/files/translation-request/${encodeURIComponent(
          String(translationRequestId)
        )}`,
        {},
        true
      );
      return unwrapList(response).map(normalizeFile);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return [];
      throw error;
    }
  },

  deleteById: async (fileId: number | string): Promise<void> => {
    await apiRequest<void>(
      `${API_BASE_PATH}/files/${encodeURIComponent(String(fileId))}`,
      { method: "DELETE" },
      true
    );
  },
};
