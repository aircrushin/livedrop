# First Upload Conversion Design

## Goal

Increase first-upload conversion on the guest upload page at `/e/[slug]` by making the initial task clearer and making upload completion feel more certain and rewarding.

## Scope

This design only changes the guest upload experience. It does not add database fields, APIs, permissions, or new product surfaces. The work is limited to copy, information hierarchy, and state presentation inside the existing guest flow.

## Problem

The current guest page behaves like a camera utility. For first-time event guests, that creates two conversion risks:

- The first step is not explicit enough after page load.
- Upload success is technically visible, but does not strongly confirm value or suggest the next action.

These two issues are most likely to reduce first-upload completion for users who enter quickly from a QR code during a live event.

## Proposed Approach

Reframe the guest page as a single-task flow:

1. Understand what to do.
2. Choose or capture a photo.
3. Upload it.
4. Receive a strong success confirmation.
5. Decide whether to upload another photo.

## UI Changes

### Header

`CameraHeader` should include a short directive that explains the page in one sentence, such as: "Take a photo and add it to the live event album."

### Empty State

`PreviewArea` should use the empty state to guide the first action instead of feeling idle. It should explain:

- "Take a photo or choose one from your gallery"
- "After upload, other guests can see it in seconds"

The intent is clarity, not marketing density.

### Primary Actions

`CameraControls` should shift from tool labels to outcome-oriented labels:

- `拍一张照片`
- `从相册选照片`
- `上传这张照片`
- `再传一张`

The control layout stays familiar; only the framing changes.

### Uploading State

The uploading state should pair progress with a stable expectation message:

- `正在上传，请不要关闭页面`

This reduces uncertainty during slow mobile network conditions.

### Success State

The success state should communicate completion and value:

- `上传成功`
- `照片已加入活动相册`

The next primary action should make repeat upload obvious: `再传一张`.

## Data Flow

No data flow changes are required. Existing authentication, file selection, upload, compression, and persistence logic remain unchanged.

## Error Handling

Existing error handling remains in place, but error copy should stay action-oriented where possible. For example, when capture or upload fails, the UI should guide the user toward a recoverable next step rather than only reporting failure.

## Success Metrics

Primary metric:

- Higher first-upload completion rate for guests entering `/e/[slug]`

Secondary signals:

- Lower abandonment between page load and first file selection
- Higher rate of second upload after first success

## Non-Goals

- Gamification, rewards, or rankings
- New guest navigation paths
- Large live-screen-specific branching
- Camera permission or storage pipeline refactors

## Verification

- Confirm the guest page still supports both camera capture and gallery selection
- Confirm all guest states still work: empty, selecting, uploading, success, error
- Confirm copy remains localized where existing translation patterns already apply
- Confirm the new wording improves clarity without pushing the main action below the fold on mobile
