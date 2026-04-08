# First Upload Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clarify the guest upload flow on `/e/[slug]` and make upload completion feel more certain and rewarding so more first-time guests finish their first upload.

**Architecture:** Keep the existing guest upload pipeline intact and improve conversion by changing only presentation and state handling inside the current camera flow. The work updates localized copy, reinforces the header/empty/upload/success states, and adds an explicit post-success reset action instead of relying on the current short auto-dismiss timer.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, next-intl, Tailwind CSS, Supabase anonymous auth, Cloudflare R2

---

## File Map

- Modify: `i18n/messages/en.json`
  Responsibility: Add the new English guest-camera copy for directive, empty state, upload hint, and success CTA.
- Modify: `i18n/messages/zh.json`
  Responsibility: Keep the Chinese camera copy aligned with the English keys.
- Modify: `app/e/[slug]/camera-header.tsx`
  Responsibility: Add a short directive under the event name using localized copy.
- Modify: `app/e/[slug]/preview-area.tsx`
  Responsibility: Replace the passive empty state and weak upload/success overlays with stronger guidance and feedback.
- Modify: `app/e/[slug]/camera-controls.tsx`
  Responsibility: Make the controls outcome-oriented with visible labels and an explicit `Upload Another` success CTA.
- Modify: `app/e/[slug]/camera-view.tsx`
  Responsibility: Thread any new success-reset handler into the controls.
- Modify: `app/e/[slug]/use-camera-view.ts`
  Responsibility: Expose a reset action for the success state and stop auto-clearing success before the user can act.

## Notes

- This repository does not currently have an automated test framework configured.
- Do not add a new test framework for this change.
- Verification for this plan uses targeted linting plus manual browser checks against a real `/e/[slug]` route.

### Task 1: Expand the Camera Copy Contract

**Files:**
- Modify: `i18n/messages/en.json`
- Modify: `i18n/messages/zh.json`

- [ ] **Step 1: Add the new English camera copy keys**

Update the `camera` object in `i18n/messages/en.json` so the guest flow has dedicated copy for the directive, empty state, upload hint, and post-success CTA.

```json
"camera": {
  "title": "Take a Photo",
  "selectPhoto": "Select Photo",
  "takePhoto": "Take Photo",
  "headerHint": "Take a photo and add it to the event album",
  "emptyTitle": "Take a photo or choose one from your gallery",
  "emptySubtitle": "After upload, other guests can see it in seconds",
  "galleryAction": "Choose from Gallery",
  "cameraAction": "Take a Photo",
  "uploading": "Uploading...",
  "uploadingHint": "Uploading now. Please keep this page open.",
  "uploadSuccess": "Photo uploaded!",
  "uploadSuccessTitle": "Upload complete",
  "uploadSuccessSubtitle": "Your photo is now in the event album",
  "uploadError": "Failed to upload photo",
  "prompt": "Take photos or choose from gallery",
  "upload": "Upload",
  "uploadSingleAction": "Upload This Photo",
  "uploadBatchAction": "Upload {count} Photos",
  "uploadAnother": "Upload Another",
  "connectError": "Could not connect. Please refresh the page.",
  "invalidFileType": "Please select an image file (JPEG, PNG, GIF, WebP, or HEIC)",
  "fileTooLarge": "Image is too large. Maximum size is 10MB.",
  "tooManyFiles": "Too many files selected. Maximum is {max} files.",
  "invalidFilesInBatch": "Some files were skipped. Only image files under 10MB are allowed.",
  "uploadFailed": "Upload failed",
  "partialUpload": "{success} of {total} photos uploaded successfully",
  "allUploadFailed": "Failed to upload all photos",
  "uploadingCount": "Uploading {current} / {total}",
  "batchUploadSuccess": "{count} photos uploaded!",
  "selectedCount": "{count} photos selected",
  "eventEnded": "This event has ended. Upload is no longer available."
}
```

- [ ] **Step 2: Mirror the same camera keys in Chinese**

Update the `camera` object in `i18n/messages/zh.json` with matching keys and conversion-oriented wording.

```json
"camera": {
  "title": "拍摄照片",
  "selectPhoto": "选择照片",
  "takePhoto": "拍照",
  "headerHint": "拍一张照片，马上加入活动相册",
  "emptyTitle": "拍一张照片或从相册中选择",
  "emptySubtitle": "上传后，其他来宾几秒内就能看到",
  "galleryAction": "从相册选照片",
  "cameraAction": "拍一张照片",
  "uploading": "上传中...",
  "uploadingHint": "正在上传，请不要关闭页面",
  "uploadSuccess": "照片已上传！",
  "uploadSuccessTitle": "上传成功",
  "uploadSuccessSubtitle": "照片已加入活动相册",
  "uploadError": "上传照片失败",
  "prompt": "拍摄照片或从相册中选择",
  "upload": "上传",
  "uploadSingleAction": "上传这张照片",
  "uploadBatchAction": "上传 {count} 张照片",
  "uploadAnother": "再传一张",
  "connectError": "无法连接，请刷新页面。",
  "invalidFileType": "请选择图片文件（JPEG、PNG、GIF、WebP 或 HEIC）",
  "fileTooLarge": "图片太大，最大不超过 10MB。",
  "tooManyFiles": "选择的文件过多，最多支持 {max} 个文件。",
  "invalidFilesInBatch": "部分文件已跳过，仅支持 10MB 以内的图片文件。",
  "uploadFailed": "上传失败",
  "partialUpload": "已成功上传 {success} / {total} 张照片",
  "allUploadFailed": "所有照片上传失败",
  "uploadingCount": "正在上传 {current} / {total}",
  "batchUploadSuccess": "{count} 张照片已上传！",
  "selectedCount": "已选择 {count} 张照片",
  "eventEnded": "活动已结束，无法继续上传。"
}
```

- [ ] **Step 3: Verify the camera locale keys are aligned**

Run:

```bash
node -e "const en=require('./i18n/messages/en.json'); const zh=require('./i18n/messages/zh.json'); const keys=[...new Set([...Object.keys(en.camera), ...Object.keys(zh.camera)])]; const missing=keys.filter((key)=>!(key in en.camera)||!(key in zh.camera)); if(missing.length){console.error('Missing camera keys:', missing.join(', ')); process.exit(1)} console.log('camera locale keys aligned')"
```

Expected:

```text
camera locale keys aligned
```

- [ ] **Step 4: Commit**

```bash
git add i18n/messages/en.json i18n/messages/zh.json
git commit -m "feat: expand guest camera conversion copy"
```

### Task 2: Reinforce Header and Preview Feedback

**Files:**
- Modify: `app/e/[slug]/camera-header.tsx`
- Modify: `app/e/[slug]/preview-area.tsx`

- [ ] **Step 1: Add a directive line to the camera header**

Update `app/e/[slug]/camera-header.tsx` to use `next-intl` and render a short directive beneath the event title.

```tsx
import { useTranslations } from "next-intl";

export function CameraHeader({ eventName, eventSlug, flash, onToggleFlash }: CameraHeaderProps) {
  const t = useTranslations("camera");

  return (
    <div className="bg-black/50 p-4 backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <LiveDropLogo
            subtitle={eventName}
            labelClassName="text-white/60"
            subtitleClassName="text-white text-base font-medium"
            iconClassName="h-8 w-8 rounded-xl"
          />
          <p className="mt-2 max-w-[240px] text-xs text-white/65 sm:max-w-sm sm:text-sm">
            {t("headerHint")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* existing live-link and flash buttons stay unchanged */}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Replace the passive preview states with stronger guidance**

Update `app/e/[slug]/preview-area.tsx` so the empty, uploading, and success states communicate the next action and the value of completion.

```tsx
if (pendingFiles.length === 0) {
  return (
    <div className="mx-auto max-w-sm px-8 text-center text-white">
      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-white/15 bg-white/5">
        <svg className="h-10 w-10 text-white/55" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {/* existing camera paths */}
        </svg>
      </div>
      <p className="text-xl font-semibold">{t("emptyTitle")}</p>
      <p className="mt-2 text-sm leading-6 text-white/60">{t("emptySubtitle")}</p>
    </div>
  );
}

{isUploading && (
  <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-black/70">
    <Loader2 className="mb-4 h-12 w-12 animate-spin text-white" />
    <div className="h-2 w-48 overflow-hidden rounded-full bg-white/20">
      <div className="h-full bg-accent transition-all duration-200" style={{ width: `${progress}%` }} />
    </div>
    <p className="mt-3 text-sm font-medium text-white">{t("uploading")}</p>
    <p className="mt-1 text-xs text-white/60">{t("uploadingHint")}</p>
  </div>
)}

{isSuccess && (
  <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-black/70">
    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500">
      <Check className="h-8 w-8 text-white" />
    </div>
    <p className="text-lg font-semibold text-white">{t("uploadSuccessTitle")}</p>
    <p className="mt-1 text-sm text-white/70">{t("uploadSuccessSubtitle")}</p>
  </div>
)}
```

- [ ] **Step 3: Lint the updated guest feedback components**

Run:

```bash
pnpm exec eslint 'app/e/[slug]/camera-header.tsx' 'app/e/[slug]/preview-area.tsx'
```

Expected:

```text
No output and exit code 0
```

- [ ] **Step 4: Commit**

```bash
git add 'app/e/[slug]/camera-header.tsx' 'app/e/[slug]/preview-area.tsx'
git commit -m "feat: strengthen guest camera guidance states"
```

### Task 3: Make the Controls Outcome-Oriented and Preserve Success CTA

**Files:**
- Modify: `app/e/[slug]/camera-controls.tsx`
- Modify: `app/e/[slug]/camera-view.tsx`
- Modify: `app/e/[slug]/use-camera-view.ts`

- [ ] **Step 1: Expose an explicit success reset action from the camera hook**

Update `app/e/[slug]/use-camera-view.ts` so success does not auto-dismiss before the user can choose the next action.

```tsx
interface UseCameraViewReturn {
  status: UploadStatus;
  progress: number;
  overallProgress: number;
  error: string;
  pendingFiles: PendingFile[];
  isAuthenticated: boolean;
  flash: boolean;
  setFlash: (value: boolean) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleUpload: () => Promise<void>;
  handleCancel: () => void;
  handleRemoveFile: (id: string) => void;
  clearError: () => void;
  resetAfterSuccess: () => void;
}

const resetAfterSuccess = useCallback(() => {
  pendingFiles.forEach((file) => URL.revokeObjectURL(file.previewUrl));
  setPendingFiles([]);
  setStatus("idle");
  setProgress(0);
  setOverallProgress(0);
  setError("");
}, [pendingFiles]);

if (successCount > 0) {
  if (isKickoffSource) {
    const storageKey = `kickoff-first-upload-${event.id}`;
    if (!sessionStorage.getItem(storageKey)) {
      trackKickoffEvent("kickoff_first_upload_after_open", {
        eventId: event.id,
        eventSlug: event.slug,
      });
      sessionStorage.setItem(storageKey, "1");
    }
  }

  setStatus("success");

  if (successCount !== totalFiles) {
    setError(t("partialUpload", { success: successCount, total: totalFiles }));
  }

  return;
}

return {
  status,
  progress,
  overallProgress,
  error,
  pendingFiles,
  isAuthenticated,
  flash,
  setFlash,
  handleFileSelect,
  handleUpload,
  handleCancel,
  handleRemoveFile,
  clearError,
  resetAfterSuccess,
};
```

- [ ] **Step 2: Thread the reset action through the camera view**

Update `app/e/[slug]/camera-view.tsx` to pass the new reset handler into the controls.

```tsx
const {
  status,
  progress,
  overallProgress,
  error,
  pendingFiles,
  isAuthenticated,
  flash,
  setFlash,
  handleFileSelect,
  handleUpload,
  handleCancel,
  handleRemoveFile,
  clearError,
  resetAfterSuccess,
} = useCameraView({ event });

<CameraControls
  hasPendingFiles={hasPendingFiles}
  isSelecting={isSelecting}
  isUploading={isUploading}
  isSuccess={isSuccess}
  fileCount={pendingFiles.length}
  onCancel={handleCancel}
  onUpload={handleUpload}
  onUploadAnother={resetAfterSuccess}
  onCameraClick={triggerCamera}
  onGalleryClick={triggerGallery}
/>
```

- [ ] **Step 3: Rework the control labels and success CTA**

Update `app/e/[slug]/camera-controls.tsx` so idle actions are visibly labeled and the success state offers a clear next step.

```tsx
interface CameraControlsProps {
  hasPendingFiles: boolean;
  isSelecting: boolean;
  isUploading: boolean;
  isSuccess: boolean;
  fileCount: number;
  onCancel: () => void;
  onUpload: () => void;
  onUploadAnother: () => void;
  onCameraClick: () => void;
  onGalleryClick: () => void;
}

if (showActions) {
  return (
    <>
      <Button variant="ghost" size="lg" onClick={onCancel} className="text-white hover:bg-white/10">
        <X className="mr-2 h-6 w-6" />
        {tCommon("cancel")}
      </Button>
      <Button size="lg" onClick={onUpload} className="bg-accent text-accent-foreground hover:bg-accent/90">
        <Upload className="mr-2 h-6 w-6" />
        {fileCount > 1 ? t("uploadBatchAction", { count: fileCount }) : t("uploadSingleAction")}
      </Button>
    </>
  );
}

if (isSuccess) {
  return (
    <Button size="lg" onClick={onUploadAnother} className="bg-accent text-accent-foreground hover:bg-accent/90">
      <Camera className="mr-2 h-5 w-5" />
      {t("uploadAnother")}
    </Button>
  );
}

return (
  <div className="grid grid-cols-2 gap-6">
    <button
      type="button"
      onClick={onCameraClick}
      disabled={!isIdle}
      aria-label={t("cameraAction")}
      className="flex flex-col items-center gap-3"
    >
      <span className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-white/10">
        <span className="h-14 w-14 rounded-full bg-white" />
      </span>
      <span className="text-sm font-medium text-white">{t("cameraAction")}</span>
    </button>

    <button
      type="button"
      onClick={onGalleryClick}
      disabled={!isIdle}
      aria-label={t("galleryAction")}
      className="flex flex-col items-center gap-3"
    >
      <span className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/60 bg-white/10">
        <ImagePlus className="h-7 w-7 text-white" />
      </span>
      <span className="text-sm font-medium text-white">{t("galleryAction")}</span>
    </button>
  </div>
);
```

- [ ] **Step 4: Lint the updated flow components**

Run:

```bash
pnpm exec eslint 'app/e/[slug]/camera-controls.tsx' 'app/e/[slug]/camera-view.tsx' 'app/e/[slug]/use-camera-view.ts'
```

Expected:

```text
No output and exit code 0
```

- [ ] **Step 5: Commit**

```bash
git add 'app/e/[slug]/camera-controls.tsx' 'app/e/[slug]/camera-view.tsx' 'app/e/[slug]/use-camera-view.ts'
git commit -m "feat: improve guest camera conversion actions"
```

### Task 4: Run Final Verification on the Guest Flow

**Files:**
- Modify: none

- [ ] **Step 1: Start the dev server**

Run:

```bash
pnpm run dev
```

Expected:

```text
Ready on http://localhost:3000
```

- [ ] **Step 2: Manually verify the guest upload route**

Open any active guest route that already exists in your local data, for example:

```text
http://localhost:3000/e/<existing-active-slug>
```

Confirm all of the following in a mobile-sized viewport:

```text
1. The header shows the new one-line directive under the event name.
2. The empty state shows both the action title and the value subtitle.
3. The idle controls show visible labels for camera and gallery.
4. Selecting one image changes the primary button text to the new upload CTA.
5. Uploading shows both progress and the “keep this page open” hint.
6. Success shows the new title/subtitle and a visible “Upload Another” button.
7. Tapping “Upload Another” clears the success state and returns to the idle controls.
8. A partial upload still leaves the error banner visible while keeping the success CTA available.
```

- [ ] **Step 3: Run the full lint pass**

Run:

```bash
pnpm run lint
```

Expected:

```text
No output and exit code 0
```

- [ ] **Step 4: Commit any final verification-driven fixes**

```bash
git add i18n/messages/en.json i18n/messages/zh.json 'app/e/[slug]/camera-header.tsx' 'app/e/[slug]/preview-area.tsx' 'app/e/[slug]/camera-controls.tsx' 'app/e/[slug]/camera-view.tsx' 'app/e/[slug]/use-camera-view.ts'
git commit -m "feat: polish first upload conversion flow"
```
