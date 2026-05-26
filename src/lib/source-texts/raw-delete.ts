export function buildRawTextDeletionPatch(now = new Date()) {
  return {
    raw_text: null,
    raw_text_deleted_at: now.toISOString()
  };
}
