import { PublicPage, Prose } from '@/components/landing/PublicPage';

export const metadata = {
  title: 'Notes',
  description: 'Notes from the Akibora team on building savings group software.',
};

export default function NotesPage() {
  return (
    <PublicPage title="Notes" intro="Short write-ups on what we're building and what chamas teach us along the way.">
      <section className="max-w-[1280px] mx-auto px-5 sm:px-8 pb-24">
        <div className="rounded-[24px] border border-dashed border-line-strong p-8 sm:p-10 max-w-[720px]">
          <h2 className="font-display text-[28px]">Nothing published yet</h2>
          <Prose>
            <p>We&apos;ll post here once we have something worth reading. Until then, the best way to follow along is to start a group and tell us what&apos;s missing.</p>
          </Prose>
        </div>
      </section>
    </PublicPage>
  );
}
