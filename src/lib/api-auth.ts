import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function requireAuth(request: Request) {
  // 1. Check Authorization Bearer token header first
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (token) {
      try {
        const supabaseAdmin = getSupabaseAdmin();
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        if (user && !error) {
          return { user, error: null };
        }
      } catch (err) {
        // Fall through to cookie check
      }
    }
  }

  // 2. Check Cookie-based auth for browser fetch requests
  const cookieHeader = request.headers.get('cookie') || '';
  if (!cookieHeader) {
    return { user: null, error: 'Unauthorized' };
  }

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieHeader.split(';').map(c => {
              const [name, ...val] = c.trim().split('=');
              return { name: name?.trim() || '', value: val.join('=') || '' };
            }).filter(c => c.name !== '');
          },
          setAll() {}
        }
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (user && !userError) {
      return { user, error: null };
    }
  } catch (err) {
    console.error('requireAuth cookie parsing error:', err);
  }

  return { user: null, error: 'Unauthorized' };
}
