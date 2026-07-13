import { ConsentBanner } from '@/components/ConsentBanner';
import { LandingAnalytics } from '@/components/LandingAnalytics';
import { CommunityCTA } from '@/components/landing/CommunityCTA';
import { Customize } from '@/components/landing/Customize';
import { Faq } from '@/components/landing/Faq';
import { Features } from '@/components/landing/Features';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { Footer } from '@/components/landing/Footer';
import { Hero } from '@/components/landing/Hero';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Marquee } from '@/components/landing/Marquee';
import { Nav } from '@/components/landing/Nav';
import { Tribes } from '@/components/landing/Tribes';
import { WhatIsIt } from '@/components/landing/WhatIsIt';

// Public landing (L1). Static-exportable: the shell is server-rendered for SEO;
// interactive islands (nav scroll, waitlist, CTAs, customize, feedback, consent,
// page_view) are client components.
export default function Landing() {
  return (
    <>
      <LandingAnalytics />
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <WhatIsIt />
        <Features />
        <HowItWorks />
        <Tribes />
        <Customize />
        <CommunityCTA />
        <FinalCTA />
        <Faq />
      </main>
      <Footer />
      <ConsentBanner />
    </>
  );
}
