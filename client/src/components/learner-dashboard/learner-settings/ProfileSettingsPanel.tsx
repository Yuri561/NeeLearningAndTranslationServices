import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  FiAlertCircle,
  FiCamera,
  FiCheck,
  FiGlobe,
  FiLock,
  FiMail,
  FiShield,
  FiTarget,
  FiTrash2,
  FiUser,
} from "react-icons/fi";
import type { AuthUser } from "../../../features/auth/authTypes";
import {
  useDeleteMyProfilePicture,
  useUpdateMyLearnerProfile,
  useUploadMyProfilePicture,
} from "../../../features/learner/learnerQueries";
import type { LearnerProfile } from "../../../features/learner/learnerTypes";
import { getErrorMessage } from "../../ui/adminFormat";
import {
  ACCEPTED_PICTURE_TYPES,
  initialsFrom,
  LANGUAGE_OPTIONS,
  MAX_PICTURE_SIZE,
  safeImageUrl,
} from "./settings.constants";

type ProfileSettingsPanelProps = {
  user: AuthUser;
  profile: LearnerProfile | null;
  completion: number;
  onStoredAvatarError: (url: string) => void;
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition placeholder:font-medium placeholder:text-slate-400 hover:border-slate-300 focus:border-haiti-navy focus:outline-none focus:ring-4 focus:ring-blue-100/50";

export const ProfileSettingsPanel = ({
  user,
  profile,
  completion,
  onStoredAvatarError,
}: ProfileSettingsPanelProps) => {
  const updateProfile = useUpdateMyLearnerProfile();
  const uploadPicture = useUploadMyProfilePicture();
  const deletePicture = useDeleteMyProfilePicture();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [learningGoals, setLearningGoals] = useState(profile?.learning_goals ?? "");
  const [preferredLanguage, setPreferredLanguage] = useState(
    profile?.preferred_language ?? "en"
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
  const [formError, setFormError] = useState("");

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl]
  );

  const isDirty =
    bio !== (profile?.bio ?? "") ||
    learningGoals !== (profile?.learning_goals ?? "") ||
    preferredLanguage !== (profile?.preferred_language ?? "en");
  const avatarUrl = previewUrl ?? safeImageUrl(profile?.profile_picture_url);
  const visibleAvatarUrl =
    avatarUrl && avatarUrl !== failedAvatarUrl ? avatarUrl : null;
  const picturePending = uploadPicture.isPending || deletePicture.isPending;

  const resetForm = () => {
    setBio(profile?.bio ?? "");
    setLearningGoals(profile?.learning_goals ?? "");
    setPreferredLanguage(profile?.preferred_language ?? "en");
    setFormError("");
  };

  const handlePictureSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!ACCEPTED_PICTURE_TYPES.includes(file.type)) {
      toast.error("Choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_PICTURE_SIZE) {
      toast.error("Profile picture must not exceed 5 MB.");
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    uploadPicture.mutate(file, {
      onSuccess: (updatedProfile) => {
        const storedPictureUrl = safeImageUrl(
          updatedProfile.profile_picture_url
        );

        if (!storedPictureUrl) {
          URL.revokeObjectURL(localPreview);
          setPreviewUrl(null);
          toast.error("The server did not return a valid profile-picture URL.");
          return;
        }

        const storedPicture = new Image();
        storedPicture.onload = () => {
          URL.revokeObjectURL(localPreview);
          setPreviewUrl(null);
          toast.success("Profile picture updated.");
        };
        storedPicture.onerror = () => {
          URL.revokeObjectURL(localPreview);
          setPreviewUrl(null);
          toast.error(
            "The upload was accepted, but the stored picture is unavailable. Check the server storage bucket."
          );
        };
        storedPicture.src = storedPictureUrl;
      },
      onError: (error) => {
        URL.revokeObjectURL(localPreview);
        setPreviewUrl(null);
        toast.error(getErrorMessage(error));
      },
    });
  };

  const handleDeletePicture = () => {
    if (!profile?.profile_picture_url || deletePicture.isPending) return;
    deletePicture.mutate(undefined, {
      onSuccess: () => toast.success("Profile picture removed."),
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedBio = bio.trim();
    const trimmedGoals = learningGoals.trim();

    if (!trimmedBio || !trimmedGoals) {
      setFormError("Please complete your bio and learning goals before saving.");
      return;
    }

    setFormError("");
    updateProfile.mutate(
      {
        bio: trimmedBio,
        learning_goals: trimmedGoals,
        preferred_language: preferredLanguage,
      },
      {
        onSuccess: () => toast.success("Your profile has been saved successfully."),
        onError: (error) => toast.error(getErrorMessage(error)),
      }
    );
  };

  return (
    <div className="grid lg:grid-cols-[18rem_minmax(0,1fr)] divide-y lg:divide-y-0 lg:divide-x divide-slate-200/80">
      {/* Sidebar: Profile Summary & Avatar upload */}
      <aside className="bg-slate-50/50 p-6 sm:p-7">
        <div className="flex flex-col items-center text-center">
          <div className="relative group size-28 shrink-0">
            {visibleAvatarUrl ? (
              <img
                src={visibleAvatarUrl}
                alt={`${user.full_name} profile`}
                onError={() => {
                  setFailedAvatarUrl(visibleAvatarUrl);
                  if (!previewUrl && profile?.profile_picture_url) {
                    onStoredAvatarError(profile.profile_picture_url);
                  }
                }}
                className="size-full rounded-2xl border-4 border-white object-cover shadow-md transition duration-300 group-hover:shadow-lg"
              />
            ) : (
              <div className="grid size-full place-items-center rounded-2xl bg-linear-to-br from-haiti-navy to-[#083b8d] text-3xl font-extrabold text-white shadow-md">
                {initialsFrom(user.full_name)}
              </div>
            )}

            {picturePending && (
              <span className="absolute inset-0 grid place-items-center rounded-2xl bg-slate-950/50 backdrop-blur-[1px]">
                <span className="size-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              </span>
            )}
          </div>

          <div className="mt-4 min-w-0 w-full">
            <h2 className="truncate text-base font-extrabold text-slate-950">
              {user.full_name}
            </h2>
            <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
              {user.email}
            </p>
          </div>
        </div>

        {/* Completion Card */}
        <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-extrabold text-slate-700">
            <span>Profile status</span>
            <span className="text-haiti-navy font-bold">{completion}%</span>
          </div>
          <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-linear-to-r from-haiti-navy to-blue-600 transition-all duration-500"
              style={{ width: `${completion}%` }}
            />
          </div>
          <p className="mt-2 text-[0.7rem] font-semibold text-slate-400">
            {completion === 100
              ? "All details completed!"
              : failedAvatarUrl
                ? "Your saved profile picture could not be loaded."
                : "Complete bio, learning goals, and photo to reach 100%."}
          </p>
        </div>

        {/* Hidden File Input & Upload Action */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          onChange={handlePictureSelection}
          className="sr-only"
          aria-label="Choose a new profile picture"
        />

        <div className="mt-6 space-y-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={picturePending}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-extrabold text-slate-700 shadow-xs transition hover:border-haiti-navy hover:bg-slate-50 hover:text-haiti-navy disabled:cursor-wait disabled:opacity-50"
          >
            <FiCamera className="size-4" />
            {profile?.profile_picture_url ? "Change Photo" : "Upload Photo"}
          </button>

          {profile?.profile_picture_url && (
            <button
              type="button"
              onClick={handleDeletePicture}
              disabled={picturePending}
              className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl px-4 text-xs font-extrabold text-slate-500 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
            >
              <FiTrash2 className="size-4" />
              Remove Photo
            </button>
          )}
        </div>

        <p className="mt-3 text-center text-[0.68rem] font-semibold leading-5 text-slate-400">
          Allowed formats: JPG, PNG, WebP · Max 5 MB
        </p>
      </aside>

      {/* Main Profile Form */}
      <form onSubmit={handleSubmit} className="flex flex-col min-w-0">
        <div className="p-6 sm:p-7 lg:p-8 flex-1 space-y-7">
          <div className="border-b border-slate-100 pb-5">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-haiti-navy">
              <FiShield className="size-4" /> Account Details
            </div>
            <h2 className="mt-1 text-xl font-extrabold text-slate-950">
              Personal Information
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Update your public profile and preferences visible to tutors.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Readonly Name */}
            <div className="space-y-2">
              <label className="flex items-center justify-between text-xs font-extrabold text-slate-700">
                <span className="flex items-center gap-2">
                  <FiUser className="text-slate-400 size-4" /> Full Name
                </span>
                <span className="inline-flex items-center gap-1 text-[0.68rem] font-bold text-slate-400">
                  <FiLock className="size-3" /> System
                </span>
              </label>
              <input
                value={user.full_name}
                readOnly
                className="h-11 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50/80 px-4 text-sm font-semibold text-slate-500"
              />
            </div>

            {/* Readonly Email */}
            <div className="space-y-2">
              <label className="flex items-center justify-between text-xs font-extrabold text-slate-700">
                <span className="flex items-center gap-2">
                  <FiMail className="text-slate-400 size-4" /> Email Address
                </span>
                <span className="inline-flex items-center gap-1 text-[0.68rem] font-bold text-slate-400">
                  <FiLock className="size-3" /> System
                </span>
              </label>
              <input
                value={user.email}
                readOnly
                className="h-11 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50/80 px-4 text-sm font-semibold text-slate-500"
              />
            </div>

            {/* Bio Field */}
            <div className="space-y-2 sm:col-span-2">
              <div className="flex items-center justify-between text-xs font-extrabold text-slate-700">
                <label htmlFor="learner-bio" className="flex items-center gap-2">
                  <FiUser className="text-slate-400 size-4" /> About You / Bio
                </label>
                <span className="font-semibold text-slate-400 text-[0.75rem]">
                  {bio.length}/500
                </span>
              </div>
              <textarea
                id="learner-bio"
                value={bio}
                maxLength={500}
                rows={4}
                onChange={(event) => {
                  setBio(event.target.value);
                  setFormError("");
                }}
                placeholder="Share a short introduction about your background, interests, or educational goals..."
                className={`${inputClass} resize-none py-3.5 leading-6`}
              />
            </div>

            {/* Learning Goals Field */}
            <div className="space-y-2 sm:col-span-2">
              <div className="flex items-center justify-between text-xs font-extrabold text-slate-700">
                <label htmlFor="learner-goals" className="flex items-center gap-2">
                  <FiTarget className="text-slate-400 size-4" /> Learning Goals
                </label>
                <span className="font-semibold text-slate-400 text-[0.75rem]">
                  {learningGoals.length}/500
                </span>
              </div>
              <textarea
                id="learner-goals"
                value={learningGoals}
                maxLength={500}
                rows={4}
                onChange={(event) => {
                  setLearningGoals(event.target.value);
                  setFormError("");
                }}
                placeholder="What specific skills or milestones are you aiming to achieve?"
                className={`${inputClass} resize-none py-3.5 leading-6`}
              />
            </div>

            {/* Preferred Language */}
            <div className="space-y-2 sm:max-w-md">
              <label htmlFor="learner-lang" className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
                <FiGlobe className="text-slate-400 size-4" /> Preferred Language
              </label>
              <select
                id="learner-lang"
                value={preferredLanguage}
                onChange={(event) => setPreferredLanguage(event.target.value)}
                className={`${inputClass} h-11 cursor-pointer`}
              >
                {LANGUAGE_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {formError && (
            <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-xs font-bold text-red-700">
              <FiAlertCircle className="size-5 shrink-0 text-red-600" />
              <span>{formError}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <footer className="flex flex-col-reverse gap-3 border-t border-slate-200/80 bg-slate-50/70 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <FiCheck className="text-emerald-600 size-4" />
            Your information is stored securely.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={resetForm}
              disabled={!isDirty || updateProfile.isPending}
              className="min-h-11 rounded-xl px-5 text-xs font-extrabold text-slate-600 transition hover:bg-slate-200/60 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={!isDirty || updateProfile.isPending}
              className="inline-flex min-h-11 min-w-36 items-center justify-center gap-2 rounded-xl bg-haiti-navy px-6 text-xs font-extrabold text-white shadow-sm transition hover:bg-haiti-navy-dark disabled:cursor-not-allowed disabled:opacity-45"
            >
              {updateProfile.isPending ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
};
