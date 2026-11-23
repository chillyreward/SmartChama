import { redirect } from 'next/navigation';

// The old page here only pretended to create a group. Groups are created in onboarding.
export default function CreateChamaRedirect() {
  redirect('/onboarding?intent=create');
}
