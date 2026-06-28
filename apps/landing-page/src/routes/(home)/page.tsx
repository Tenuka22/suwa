import { Appear } from "./animations/appear";
import { Navbar } from "./helpers/navbar";
import { ClosingCallout } from "./sections/closing-callout";
import { Doctors } from "./sections/doctors";
import { Faq } from "./sections/faq";
import { Footer } from "./sections/footer";
import { Hero } from "./sections/hero";
import { HowItWorks } from "./sections/how-it-works";
import { ProblemSolution } from "./sections/problem-solution";
import { ProofBar } from "./sections/proof-bar";
import { Services } from "./sections/services";
import { Team } from "./sections/team";
import { Testimonials } from "./sections/testimonials";
import { TrustStrip } from "./sections/trust-strip";
import { WaysToConnect } from "./sections/ways-to-connect";

export function LandingPage() {
  return (
    <div className="overflow-hidden bg-background">
      <Navbar />
      <main>
        <Appear>
          <Hero />
        </Appear>
        <Appear delay={0.06}>
          <TrustStrip />
        </Appear>
        <Appear delay={0.15}>
          <Doctors />
        </Appear>
        <Appear delay={0.18}>
          <ProblemSolution />
        </Appear>
        <Appear delay={0.24}>
          <Services />
        </Appear>
        <Appear delay={0.3}>
          <WaysToConnect />
        </Appear>
        <Appear delay={0.36}>
          <HowItWorks />
        </Appear>
        <Appear delay={0.42}>
          <Testimonials />
        </Appear>
        <Appear delay={0.48}>
          <Faq />
        </Appear>

        <Appear delay={0.12}>
          <ProofBar />
        </Appear>

        <Appear delay={0.52}>
          <Team />
        </Appear>
        <Appear delay={0.58}>
          <ClosingCallout />
        </Appear>
      </main>
      <Appear delay={0.66}>
        <Footer />
      </Appear>
    </div>
  );
}
