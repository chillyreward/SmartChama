import { notFound } from 'next/navigation';
import TestAfricasTalkingPage from './TestClient';

// Developer tool for checking SMS delivery. Hidden on the live site.
export default function Page() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <TestAfricasTalkingPage />;
}
