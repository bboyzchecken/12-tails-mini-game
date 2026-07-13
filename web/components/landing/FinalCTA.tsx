import { FeedbackForm } from './FeedbackForm';
import { Reveal } from './Reveal';
import { WaitlistForm } from './WaitlistForm';

export function FinalCTA() {
  return (
    <section className="bg-cream-2/40 py-16 sm:py-24">
      <div className="mx-auto max-w-[640px] px-6 text-center">
        <Reveal>
          <div className="eyebrow">ไม่พลาดตอนเปิดจริง</div>
          <h2 className="mt-2 font-head text-[1.9rem] font-semibold text-ink sm:text-[2.2rem]">
            รับข่าว &amp; <span className="text-gradient">บอกเราว่าอยากได้อะไร</span>
          </h2>
          <p className="mx-auto mt-3 max-w-[46ch] text-soft">
            กรอกอีเมลไว้รับแจ้งเตือนตอนเปิดตัว และช่วยบอกเราว่าอยากเห็นเผ่าหรือชุดแบบไหนในลานนี้
          </p>
        </Reveal>
        <Reveal delay={100}>
          <WaitlistForm source="footer" />
        </Reveal>
        <Reveal delay={160}>
          <div className="mt-8 border-t border-line pt-8">
            <FeedbackForm />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
