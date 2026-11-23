import { PublicPage, Prose } from '@/components/landing/PublicPage';
import { ButtonLink } from '@/components/ui';
import { SITE } from '@/lib/site';

export const metadata = {
  title: 'Working with us',
  description: 'Akibora is a small team and is not hiring right now.',
};

export default function CareersPage() {
  return (
    <PublicPage title="We're not hiring yet." intro="Akibora is a small team building toward launch. There are no open roles right now, and we won't list jobs that don't exist.">
      <section className="max-w-[1280px] mx-auto px-5 sm:px-8 pb-24">
        <Prose>
          <p>
            If you run a chama, work at a SACCO, or build for M-Pesa and want to help shape what we make, we&apos;d still like to hear from you.
            When roles open, they&apos;ll be posted here first.
          </p>
        </Prose>
        <ButtonLink href={`mailto:${SITE.contactEmail}?subject=${encodeURIComponent('Working with Akibora')}`} size="lg" className="mt-8">Get in touch</ButtonLink>
      </section>
    </PublicPage>
  );
}
