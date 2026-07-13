import { ConsentBanner } from '@/components/ConsentBanner';
import { LandingAnalytics } from '@/components/LandingAnalytics';
import { CommunityCTA } from '@/components/landing/CommunityCTA';
import { Features } from '@/components/landing/Features';
import { Footer } from '@/components/landing/Footer';
import { Hero } from '@/components/landing/Hero';
import { Nav } from '@/components/landing/Nav';
import { Tribes } from '@/components/landing/Tribes';

// Public landing (L1). Static-exportable: the shell is server-rendered for SEO;
// interactive islands (waitlist, CTAs, consent, page_view) are client components.
export default function Landing() {
  return (
    <>
      <LandingAnalytics />
      <Nav />
      <Hero />
      <Features />
      <Tribes />
      <CommunityCTA />
      <Footer />
      <ConsentBanner />
    </>
  );
}
