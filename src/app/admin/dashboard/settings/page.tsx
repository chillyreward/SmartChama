import { redirect } from 'next/navigation';

// Older duplicate of /admin/settings; kept as a redirect so bookmarks still work.
export default function Redirect() {
  redirect('/admin/settings');
}
