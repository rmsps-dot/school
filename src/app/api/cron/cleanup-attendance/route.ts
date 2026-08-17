import { type NextRequest } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase/admin'

// Force dynamic so Vercel never caches this route
export const dynamic = 'force-dynamic'

/**
 * GET /api/cron/cleanup-attendance
 *
 * Called nightly by Vercel Cron.
 * Secured by a Bearer token matching CRON_SECRET env variable.
 *
 * Logic:
 *   1. Find all teacher_attendance rows older than 24 hours that still have a photo_url.
 *   2. Extract the storage object path from the URL.
 *   3. Batch-delete the objects from the attendance-photos bucket.
 *   4. Null out photo_url in the DB rows (attendance record is preserved).
 */
export async function GET(request: NextRequest) {
  /* ── Guard: CRON_SECRET must be configured ────────────── */
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error('[cleanup-attendance] CRON_SECRET env var is not set! Route is disabled.')
    return Response.json({ error: 'Cron route not configured.' }, { status: 503 })
  }

  /* ── 1. Auth check ─────────────────────────────────────── */
  const authHeader = request.headers.get('authorization')

  if (authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  /* ── 2. Find stale attendance rows (older than 24 hours, with a photo) ── */
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: staleRows, error: fetchError } = await supabaseAdmin
    .from('teacher_attendance')
    .select('id, photo_url')
    .not('photo_url', 'is', null)
    .lt('created_at', cutoff)

  if (fetchError) {
    console.error('[cleanup-attendance] Fetch error:', fetchError.message)
    return Response.json({ error: fetchError.message }, { status: 500 })
  }

  if (!staleRows || staleRows.length === 0) {
    console.log('[cleanup-attendance] No stale photos to clean up.')
    return Response.json({ success: true, deleted: 0, message: 'Nothing to clean up.' })
  }

  console.log(`[cleanup-attendance] Found ${staleRows.length} stale photo(s). Cleaning up...`)

  /* ── 3. Extract storage object paths from the public URLs ── */
  //
  // Supabase public URL format:
  //   https://<project>.supabase.co/storage/v1/object/public/attendance-photos/teachers/<id>/<date>.jpg
  //
  // We need just the path AFTER the bucket name:
  //   teachers/<id>/<date>.jpg
  //
  const BUCKET = 'attendance-photos'
  const bucketPathMarker = `/object/public/${BUCKET}/`

  const storagePaths: string[] = []
  const rowIds: string[] = []

  for (const row of staleRows) {
    if (!row.photo_url) continue
    const markerIndex = row.photo_url.indexOf(bucketPathMarker)
    if (markerIndex === -1) {
      // URL doesn't match expected format — skip but still null out the DB field
      rowIds.push(row.id)
      continue
    }
    const objectPath = row.photo_url.slice(markerIndex + bucketPathMarker.length)
    storagePaths.push(objectPath)
    rowIds.push(row.id)
  }

  /* ── 4. Delete storage objects ──────────────────────────── */
  let storageDeletedCount = 0
  const storageErrors: string[] = []

  if (storagePaths.length > 0) {
    const { data: deleted, error: storageError } = await supabaseAdmin.storage
      .from(BUCKET)
      .remove(storagePaths)

    if (storageError) {
      // Don't abort — still null out the DB so URLs don't linger
      console.error('[cleanup-attendance] Storage delete error:', storageError.message)
      storageErrors.push(storageError.message)
    } else {
      storageDeletedCount = deleted?.length ?? storagePaths.length
      console.log(`[cleanup-attendance] Deleted ${storageDeletedCount} file(s) from storage.`)
    }
  }

  /* ── 5. Null out photo_url in DB rows ───────────────────── */
  const { error: updateError } = await supabaseAdmin
    .from('teacher_attendance')
    .update({ photo_url: null })
    .in('id', rowIds)

  if (updateError) {
    console.error('[cleanup-attendance] DB update error:', updateError.message)
    return Response.json(
      {
        success: false,
        storageDeleted: storageDeletedCount,
        dbError: updateError.message,
        storageErrors,
      },
      { status: 500 }
    )
  }

  console.log(`[cleanup-attendance] Nulled photo_url on ${rowIds.length} DB row(s). Done.`)

  return Response.json({
    success: true,
    rowsProcessed: rowIds.length,
    storageFilesDeleted: storageDeletedCount,
    storageErrors: storageErrors.length > 0 ? storageErrors : undefined,
    cutoffTime: cutoff,
  })
}
