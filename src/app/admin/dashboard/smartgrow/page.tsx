import { redirect } from 'next/navigation';

// Older duplicate of /admin/smartgrow; kept as a redirect so bookmarks still work.
export default function Redirect() {
  redirect('/admin/smartgrow');
}
