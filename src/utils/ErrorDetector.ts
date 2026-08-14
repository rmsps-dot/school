

// Dictionary mapping Supabase/Postgres Error Codes to Human-Readable UI Messages
export const POSTGRES_ERROR_CODES: Record<string, string> = {
  '42P01': 'Database Error: A required table or relation is missing from the database. Please check schema migrations.',
  '23505': 'Database Error: Duplicate entry found. This record already exists.',
  '23503': 'Database Error: Foreign key violation. You are trying to reference a record that does not exist.',
  '42601': 'Database Error: Syntax error in the SQL query.',
  'PGRST116': 'Security Error: You are not authorized to perform this action, or no rows were found due to Row Level Security (RLS).',
  '42501': 'Security Error: Insufficient privileges. You do not have permission to access this table.',
  '08P01': 'Database Error: Protocol violation. Invalid request to the database.',
  '22P02': 'Data Error: Invalid text representation. Ensure numbers and UUIDs are formatted correctly.',
}

export function parseError(err: unknown): string {
  if (typeof err === 'string') return err
  if (typeof err === 'object' && err !== null) {
    const errorObj = err as { code?: string, message?: string, stack?: string };
    if (errorObj.code && POSTGRES_ERROR_CODES[errorObj.code]) {
      return POSTGRES_ERROR_CODES[errorObj.code]
    }
    if (errorObj.message) {
      if (errorObj.message.includes('Row Level Security')) return POSTGRES_ERROR_CODES['PGRST116']
      return errorObj.message
    }
  }
  return 'An unknown internal error occurred.'
}

export async function logErrorToSystem(err: unknown, context: string = 'Unknown Context') {
  const timestamp = new Date().toISOString()
  const humanReadableMessage = parseError(err)
  
  const errorObj = (typeof err === 'object' && err !== null) ? err as { code?: string, stack?: string } : {};
  
  const logData = {
    timestamp,
    context,
    userMessage: humanReadableMessage,
    rawError: err,
    stack: errorObj.stack || 'No stack trace available'
  }

  // 1. Log beautifully to Terminal
  console.error('\n==================== [ RMSPS ERROR DETECTOR ] ====================')
  console.error(`[TIME]:    ${timestamp}`)
  console.error(`[CONTEXT]: ${context}`)
  console.error(`[MESSAGE]: ${humanReadableMessage}`)
  if (errorObj.code) console.error(`[DB CODE]: ${errorObj.code}`)
  console.error('==================================================================\n')

  // 2. Append to physical log file for the AI/Developer to inspect
}
/**
 * Higher-Order Function wrapper for Server Actions.
 * Catches all errors, logs them explicitly, and returns a standard { error: string } object for the UI.
 */
export function withErrorDetector<T extends (...args: never[]) => Promise<unknown>>(
  actionName: string,
  fn: T
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>> | { error: string }> {
  return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>> | { error: string }> => {
    try {
      const result = await fn(...args)
      
      // If the action returned an expected { error } object internally (like Supabase usually does),
      // we can intercept and format it too!
      if (result && typeof result === 'object' && 'error' in result && result.error) {
        await logErrorToSystem(result.error, `Server Action: ${actionName}`)
        return { ...result, error: parseError(result.error) }
      }
      
      return result as Awaited<ReturnType<T>>
    } catch (err: unknown) {
      await logErrorToSystem(err, `Server Action Exception: ${actionName}`)
      return { error: parseError(err) }
    }
  }
}
