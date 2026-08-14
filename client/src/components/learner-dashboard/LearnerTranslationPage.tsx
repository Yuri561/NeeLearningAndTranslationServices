import { useMemo, useRef, useState } from "react";
import {
  FiAlertCircle,
  FiArrowRight,
  FiBookOpen,
  FiCheck,
  FiChevronDown,
  FiClipboard,
  FiCopy,
  FiEdit3,
  FiExternalLink,
  FiFileText,
  FiRefreshCw,
  FiTrash2,
  FiUploadCloud,
  FiX,
} from "react-icons/fi";
import { useCurrentUser } from "../../features/auth/authQueries";
import {
  useTranslateText,
  useTranslationFileDetails,
  useTranslationLanguages,
  useUploadTranslationFile,
} from "../../features/learner/learnerQueries";
import type {
  SupportedLanguage,
  TranslationFile,
  TranslationItem,
} from "../../features/learner/learnerTypes";

const MAX_CHARACTERS = 5000;
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ACCEPTED_FILE_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "application/rtf",
]);

const looksLikeProviderError = (text: string) =>
  /invalid (?:source |target )?language|translation (?:request )?failed|provider (?:failed|error|unavailable)|service unavailable|too many requests|rate limit|quota (?:exceeded|reached)|langpair=.*(?:iso|rfc)/i.test(
    text,
  );

const itemError = (item: TranslationItem) =>
  item.error?.trim() ||
  (looksLikeProviderError(item.translated) ? item.translated : null);

const storageKeyForUser = (userId?: number) =>
  userId ? `nee-translation-file-ids:${userId}` : "";

const readStoredFileIds = (userId?: number) => {
  const storageKey = storageKeyForUser(userId);
  if (!storageKey || typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is number => Number.isFinite(id) && id > 0);
  } catch {
    return [];
  }
};

const writeStoredFileIds = (userId: number, fileIds: number[]) => {
  const storageKey = storageKeyForUser(userId);
  if (!storageKey || typeof window === "undefined") return;
  window.localStorage.setItem(storageKey, JSON.stringify([...new Set(fileIds)]));
};

const formatFileSize = (bytes?: number) => {
  if (!Number.isFinite(bytes) || !bytes) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let size = bytes / 1024;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unitIndex]}`;
};

const formatUploadDate = (value?: string) => {
  if (!value) return "Unknown date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const isValidTranslationFile = (file: File) => {
  if (ACCEPTED_FILE_TYPES.has(file.type)) return true;
  return /\.(pdf|doc|docx|txt|rtf)$/i.test(file.name);
};

const validateTranslationFile = (file: File | null) => {
  if (!file) return "Choose a PDF or document before uploading.";
  if (!isValidTranslationFile(file)) {
    return "Please choose a PDF, Word document, TXT, or RTF file.";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "Please choose a file smaller than 15 MB.";
  }
  return "";
};

const isUploadedFile = (file: TranslationFile | undefined): file is TranslationFile =>
  Boolean(file?.id && file.file_url && file.file_name);

const UploadedFileRow = ({ file }: { file: TranslationFile }) => (
  <div className="grid gap-4 border-b border-slate-100 px-4 py-4 last:border-b-0 md:grid-cols-[minmax(0,1.6fr)_1fr_1fr_auto] md:items-center">
    <div className="flex min-w-0 items-start gap-3">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-haiti-navy">
        <FiFileText className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-extrabold text-slate-900">{file.file_name}</p>
        <p className="mt-1 text-xs font-semibold text-slate-400">File ID #{file.id}</p>
      </div>
    </div>
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Details</p>
      <p className="mt-1 text-sm font-semibold text-slate-600">{file.file_type || "Unknown type"} · {formatFileSize(file.file_size)}</p>
    </div>
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Uploaded</p>
      <p className="mt-1 text-sm font-semibold text-slate-600">{formatUploadDate(file.created_at)}</p>
      <p className="mt-1 text-xs text-slate-400">Request #{file.related_translation_request_id ?? "Not linked"}</p>
    </div>
    <a
      href={file.file_url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-haiti-navy px-4 text-sm font-bold text-white transition hover:bg-haiti-navy-dark"
    >
      Open File <FiExternalLink />
    </a>
  </div>
);

const LanguageSelect = ({
  languages,
  value,
  onChange,
  disabled,
}: {
  languages: SupportedLanguage[];
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
}) => (
  <label className="relative block">
    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
      Translate to
    </span>
    <select
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-4 pr-11 text-sm font-bold text-slate-700 outline-none transition hover:border-slate-300 focus:border-haiti-navy focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {languages.length === 0 && <option value="">No languages available</option>}
      {languages.map((language) => (
        <option key={language.code} value={language.code}>
          {language.flag} {language.name} · {language.nativeName} ({language.code})
        </option>
      ))}
    </select>
    <FiChevronDown className="pointer-events-none absolute bottom-4 right-4 size-4 text-slate-400" />
  </label>
);

const ResultEmptyState = () => (
  <div className="flex min-h-[25rem] flex-1 items-center justify-center p-8 text-center">
    <div>
      <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-blue-50 text-haiti-navy">
        <FiBookOpen className="size-7" />
      </span>
      <h2 className="mt-5 text-lg font-extrabold text-slate-900">Ready when you are</h2>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500">
        Enter a word, sentence, or paragraph to start translating and build your language confidence.
      </p>
    </div>
  </div>
);

const ResultLoadingState = () => (
  <div className="flex min-h-[25rem] flex-1 items-center justify-center p-8 text-center" aria-live="polite">
    <div>
      <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-blue-50">
        <span className="size-7 animate-spin rounded-full border-[3px] border-blue-200 border-t-haiti-navy" />
      </span>
      <h2 className="mt-5 text-lg font-extrabold text-slate-900">Translating your text…</h2>
      <p className="mt-2 text-sm text-slate-500">Finding the clearest way to express it.</p>
    </div>
  </div>
);

const ResultErrorState = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) => (
  <div className="flex min-h-[25rem] flex-1 items-center justify-center p-8 text-center">
    <div>
      <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-red-50 text-haiti-red">
        <FiAlertCircle className="size-7" />
      </span>
      <h2 className="mt-5 text-lg font-extrabold text-slate-900">Translation wasn&apos;t completed</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-haiti-navy px-5 text-sm font-bold text-white transition hover:bg-haiti-navy-dark"
      >
        <FiRefreshCw /> Try again
      </button>
    </div>
  </div>
);

const TranslationResult = ({
  item,
  responseProvider,
  copied,
  onCopy,
}: {
  item: TranslationItem;
  responseProvider: string;
  copied: boolean;
  onCopy: () => void;
}) => {
  const error = itemError(item);

  if (error) {
    return (
      <div className="flex min-h-[25rem] flex-1 flex-col p-5 sm:p-6">
        <div className="rounded-2xl border border-red-100 bg-red-50/60 p-5">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-700">
            <FiAlertCircle /> Provider error
          </span>
          <p className="mt-3 break-words text-sm leading-7 text-red-700">{error}</p>
          <p className="mt-3 text-xs text-red-500">
            Provider: {item.provider || responseProvider || "Unknown"}
          </p>
        </div>
        <div className="mt-5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Original text</p>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-slate-600">{item.original}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[25rem] flex-1 flex-col p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-600">Translation ready</p>
          <p className="mt-1 text-xs text-slate-400">Via {item.provider || responseProvider || "automatic provider"}</p>
        </div>
        <button
          type="button"
          onClick={onCopy}
          className={`inline-flex h-10 items-center gap-2 rounded-xl px-3.5 text-xs font-bold transition ${
            copied
              ? "bg-emerald-50 text-emerald-700"
              : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-haiti-navy"
          }`}
          aria-label="Copy translated text"
        >
          {copied ? <FiCheck /> : <FiCopy />} {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <div className="mt-6 flex-1">
        <p className="whitespace-pre-wrap break-words text-lg font-semibold leading-8 text-slate-900 sm:text-xl">
          {item.translated}
        </p>
      </div>

      <div className="mt-7 border-t border-slate-100 pt-5">
        <p className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400">Original text</p>
        <p className="mt-2 line-clamp-4 whitespace-pre-wrap break-words text-sm leading-6 text-slate-500">{item.original}</p>
      </div>
    </div>
  );
};

export const LearnerTranslationPage = () => {
  const { data: user } = useCurrentUser();
  const languagesQuery = useTranslationLanguages();
  const translation = useTranslateText();
  const uploadFile = useUploadTranslationFile();
  const languages = languagesQuery.data?.languages ?? [];
  const [input, setInput] = useState("");
  const [target, setTarget] = useState("en");
  const [validationError, setValidationError] = useState("");
  const [copied, setCopied] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [fileSuccess, setFileSuccess] = useState("");
  const [requestId, setRequestId] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<TranslationFile[]>([]);
  const [storageVersion, setStorageVersion] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const storedFileIds = useMemo(
    () => {
      void storageVersion;
      return readStoredFileIds(user?.id);
    },
    [user?.id, storageVersion],
  );
  const storedFileQueries = useTranslationFileDetails(storedFileIds);
  const storedFiles = storedFileQueries
    .map((query) => query.data)
    .filter(isUploadedFile);
  const uploadedFileMap = useMemo(
    () =>
      [...storedFiles, ...uploadedFiles.filter((file) => file.uploaded_by_user_id === user?.id)].reduce<Map<number, TranslationFile>>((files, file) => {
        files.set(file.id, file);
        return files;
      }, new Map()),
    [storedFiles, uploadedFiles, user?.id],
  );
  const visibleUploadedFiles = [...uploadedFileMap.values()].sort((a, b) => b.id - a.id);
  const isLoadingStoredFiles = storedFileQueries.some((query) => query.isLoading);
  const storedFilesError = storedFileQueries.find((query) => query.isError)?.error;
  const result = translation.data?.translations[0];

  const effectiveTarget = languages.some((language) => language.code === target)
    ? target
    : (languages.find((language) => language.code === "en")?.code ?? languages[0]?.code ?? "");

  const selectedLanguage = languages.find((language) => language.code === effectiveTarget);

  const submitTranslation = () => {
    const text = input.trim();
    if (!text) {
      setValidationError("Enter some text before translating.");
      return;
    }
    if (!effectiveTarget) {
      setValidationError("Choose a target language first.");
      return;
    }
    setValidationError("");
    setCopied(false);
    translation.mutate({ texts: [text], target: effectiveTarget, provider: "auto" });
  };

  const clearAll = () => {
    setInput("");
    setValidationError("");
    setCopied(false);
    translation.reset();
  };

  const copyResult = async () => {
    if (!result?.translated || itemError(result)) return;
    try {
      await navigator.clipboard.writeText(result.translated);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  const chooseFile = (file: File | null) => {
    setFileSuccess("");
    const error = validateTranslationFile(file);
    setSelectedFile(error ? null : file);
    setFileError(error);
  };

  const submitFileUpload = () => {
    const userId = user?.id;
    const trimmedRequestId = requestId.trim();
    const numericRequestId = Number(trimmedRequestId);
    const selectedFileError = validateTranslationFile(selectedFile);

    if (!userId) {
      setFileError("Your learner account could not be identified. Please sign in again.");
      return;
    }
    if (selectedFileError) {
      setFileError(selectedFileError);
      return;
    }
    if (!trimmedRequestId || !Number.isInteger(numericRequestId) || numericRequestId < 0) {
      setFileError("Enter a valid translation request ID before uploading.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile!);
    formData.append("uploaded_by_user_id", String(userId));
    formData.append("related_translation_request_id", String(numericRequestId));

    setFileError("");
    setFileSuccess("");
    uploadFile.mutate(formData, {
      onSuccess: (file) => {
        if (!isUploadedFile(file)) {
          setFileError("The upload finished, but the server returned incomplete file details.");
          return;
        }

        setUploadedFiles((files) => [file, ...files.filter((item) => item.id !== file.id)]);
        const currentFileIds = readStoredFileIds(userId);
        const nextFileIds = [file.id, ...currentFileIds.filter((id) => id !== file.id)];
        writeStoredFileIds(userId, nextFileIds);
        setStorageVersion((version) => version + 1);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setFileSuccess(`${file.file_name} was uploaded successfully.`);
      },
      onError: (error) => {
        setFileError(error instanceof Error ? error.message : "The file could not be uploaded. Please try again.");
      },
    });
  };

  const apiErrorMessage =
    translation.error instanceof Error
      ? translation.error.message
      : "The translation service is temporarily unavailable. Please try again.";

  return (
    <section>
      <div className="overflow-hidden rounded-3xl bg-haiti-navy px-5 py-7 text-white shadow-[0_18px_50px_rgba(6,67,159,.16)] sm:px-8 sm:py-9">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-200">
              <FiUploadCloud /> Learner translation service
            </p>
            <h1 className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">Translation Documents</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
              Upload PDF and document files for translation, then keep track of the files connected to your translation requests.
            </p>
          </div>
          {!languagesQuery.isLoading && !languagesQuery.isError && (
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-2xl font-extrabold">{languages.length}</p>
              <p className="text-xs font-semibold text-blue-100">supported languages</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,.05)] sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-haiti-red">Upload document</p>
              <h2 className="mt-1 text-lg font-extrabold text-slate-900">Send a file for translation</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Choose a PDF or supported document and link it to the translation request your team is handling.
              </p>
            </div>
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-blue-50 text-haiti-navy">
              <FiUploadCloud className="size-6" />
            </span>
          </div>

          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") fileInputRef.current?.click();
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              chooseFile(event.dataTransfer.files.item(0));
            }}
            className="mt-6 flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 px-5 py-8 text-center transition hover:border-haiti-navy hover:bg-blue-50"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.rtf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,application/rtf"
              className="sr-only"
              onChange={(event) => chooseFile(event.target.files?.item(0) ?? null)}
            />
            <span className="grid size-14 place-items-center rounded-2xl bg-white text-haiti-navy shadow-sm">
              <FiFileText className="size-6" />
            </span>
            <p className="mt-4 text-sm font-extrabold text-slate-900">
              {selectedFile ? selectedFile.name : "Drop your document here or click to browse"}
            </p>
            <p className="mt-2 text-xs font-semibold text-slate-400">
              PDF preferred. DOC, DOCX, TXT, and RTF are accepted up to 15 MB.
            </p>
          </div>

          {selectedFile && (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-800">{selectedFile.name}</p>
                <p className="mt-1 text-xs text-slate-400">{selectedFile.type || "Document"} · {formatFileSize(selectedFile.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setFileError("");
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="grid size-9 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-white hover:text-haiti-red"
                aria-label="Remove selected file"
              >
                <FiX />
              </button>
            </div>
          )}

          <label className="mt-5 block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
              Translation request ID
            </span>
            <input
              value={requestId}
              inputMode="numeric"
              onChange={(event) => {
                setRequestId(event.target.value);
                if (fileError) setFileError("");
              }}
              placeholder="Enter the related request ID"
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-haiti-navy focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </label>

          {(fileError || fileSuccess) && (
            <div className={`mt-4 rounded-2xl border p-4 text-sm font-semibold ${fileError ? "border-red-100 bg-red-50 text-red-700" : "border-emerald-100 bg-emerald-50 text-emerald-700"}`}>
              {fileError || fileSuccess}
            </div>
          )}

          <button
            type="button"
            onClick={submitFileUpload}
            disabled={uploadFile.isPending}
            className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-haiti-navy px-6 text-sm font-bold text-white shadow-[0_8px_20px_rgba(6,67,159,.2)] transition hover:-translate-y-0.5 hover:bg-haiti-navy-dark disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
          >
            {uploadFile.isPending ? <><span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Uploading document</> : <>Upload document <FiArrowRight /></>}
          </button>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_12px_40px_rgba(15,23,42,.05)]">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-end sm:px-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-haiti-red">My Uploaded Translation Files</p>
              <h2 className="mt-1 text-lg font-extrabold text-slate-900">Uploaded documents</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Files appear here after upload. Saved file IDs are loaded again on this browser.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-400">{visibleUploadedFiles.length} file{visibleUploadedFiles.length === 1 ? "" : "s"}</span>
          </div>

          {storedFilesError && (
            <div className="m-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
              Some saved files could not be loaded. {storedFilesError instanceof Error ? storedFilesError.message : "Please try again later."}
            </div>
          )}

          {isLoadingStoredFiles && visibleUploadedFiles.length === 0 ? (
            <div className="grid min-h-72 place-items-center p-8 text-center">
              <div>
                <span className="mx-auto block size-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-haiti-navy" />
                <p className="mt-4 text-sm font-semibold text-slate-500">Loading uploaded files...</p>
              </div>
            </div>
          ) : visibleUploadedFiles.length > 0 ? (
            <div>
              {visibleUploadedFiles.map((file) => (
                <UploadedFileRow key={file.id} file={file} />
              ))}
            </div>
          ) : (
            <div className="grid min-h-72 place-items-center p-8 text-center">
              <div>
                <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-slate-50 text-slate-400">
                  <FiFileText className="size-7" />
                </span>
                <h3 className="mt-5 text-lg font-extrabold text-slate-900">No documents uploaded yet</h3>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  Upload your first translation document and it will appear here immediately.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {languagesQuery.isLoading && (
        <div className="mt-6 grid min-h-32 place-items-center rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
            <span className="size-5 animate-spin rounded-full border-[3px] border-slate-200 border-t-haiti-navy" />
            Loading supported languages…
          </div>
        </div>
      )}

      {languagesQuery.isError && (
        <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-2xl border border-red-100 bg-red-50/60 p-5 sm:flex-row sm:items-center">
          <div>
            <p className="flex items-center gap-2 text-sm font-extrabold text-red-700"><FiAlertCircle /> Supported languages could not be loaded</p>
            <p className="mt-1 text-xs leading-5 text-red-500">{languagesQuery.error instanceof Error ? languagesQuery.error.message : "Please check your connection and try again."}</p>
          </div>
          <button type="button" onClick={() => languagesQuery.refetch()} disabled={languagesQuery.isFetching} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-white px-4 text-xs font-bold text-red-700 shadow-sm transition hover:bg-red-100 disabled:opacity-60"><FiRefreshCw className={languagesQuery.isFetching ? "animate-spin" : ""} /> Retry</button>
        </div>
      )}

      {!languagesQuery.isLoading && !languagesQuery.isError && languages.length === 0 && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-semibold text-amber-800">
          No supported languages are currently available. Please try again later.
        </div>
      )}

      {!languagesQuery.isLoading && !languagesQuery.isError && languages.length > 0 && (
        <>
          <div className="mt-6 grid overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_12px_40px_rgba(15,23,42,.05)] xl:grid-cols-2">
            <div className="border-b border-slate-200 p-5 sm:p-6 xl:border-b-0 xl:border-r">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-haiti-red">Your text</p>
                  <h2 className="mt-1 text-lg font-extrabold text-slate-900">What would you like to translate?</h2>
                </div>
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-haiti-navy"><FiEdit3 className="size-5" /></span>
              </div>

              <label className="mt-6 block">
                <span className="sr-only">Text to translate</span>
                <textarea
                  value={input}
                  maxLength={MAX_CHARACTERS}
                  onChange={(event) => {
                    setInput(event.target.value);
                    if (validationError) setValidationError("");
                  }}
                  placeholder="Type or paste a word, sentence, or short paragraph…"
                  className="min-h-64 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-4 text-base leading-7 text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-haiti-navy focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </label>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className={`text-xs font-semibold ${validationError ? "text-red-600" : "text-slate-400"}`}>{validationError || "Multiple lines will be translated together."}</p>
                <span className={`shrink-0 text-xs font-semibold ${input.length > MAX_CHARACTERS * 0.9 ? "text-amber-600" : "text-slate-400"}`}>{input.length.toLocaleString()} / {MAX_CHARACTERS.toLocaleString()}</span>
              </div>

              <div className="mt-5">
                <LanguageSelect languages={languages} value={effectiveTarget} onChange={(code) => { setTarget(code); translation.reset(); setCopied(false); }} />
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
                <button type="button" onClick={clearAll} disabled={!input && !translation.data && !translation.error} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><FiTrash2 /> Clear</button>
                <button type="button" onClick={submitTranslation} disabled={translation.isPending || !input.trim() || !effectiveTarget} className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-haiti-navy px-6 text-sm font-bold text-white shadow-[0_8px_20px_rgba(6,67,159,.2)] transition hover:-translate-y-0.5 hover:bg-haiti-navy-dark disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60">
                  {translation.isPending ? <><span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Translating…</> : <>Translate to {selectedLanguage?.name ?? "selected language"} <FiArrowRight /></>}
                </button>
              </div>
            </div>

            <div className="flex min-h-[32rem] flex-col bg-slate-50/40">
              <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-lg bg-blue-50 text-haiti-navy"><FiClipboard className="size-4" /></span>
                  <div>
                    <p className="text-sm font-extrabold text-slate-900">Translation result</p>
                    <p className="text-xs text-slate-400">{selectedLanguage ? `${selectedLanguage.flag} ${selectedLanguage.name}` : "Choose a language"}</p>
                  </div>
                </div>
              </div>
              {translation.isPending ? (
                <ResultLoadingState />
              ) : translation.isError ? (
                <ResultErrorState message={apiErrorMessage} onRetry={submitTranslation} />
              ) : result ? (
                <TranslationResult item={result} responseProvider={translation.data?.provider ?? ""} copied={copied} onCopy={copyResult} />
              ) : (
                <ResultEmptyState />
              )}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">Popular languages for practice</h2>
                <p className="mt-1 text-xs text-slate-400">Jump to a language and keep exploring.</p>
              </div>
              <p className="text-xs font-semibold text-slate-400">{languages.length} available in the selector</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {languages.slice(0, 10).map((language) => (
                <button key={language.code} type="button" onClick={() => setTarget(language.code)} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition ${effectiveTarget === language.code ? "border-haiti-navy bg-blue-50 text-haiti-navy" : "border-slate-200 text-slate-600 hover:border-blue-200 hover:bg-blue-50/50"}`}>
                  <span>{language.flag}</span> {language.name}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
};
