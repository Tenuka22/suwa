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

export function LandingPage() {
  return (
    <div className="overflow-hidden bg-background px-4 sm:px-6 lg:px-8">
      <Navbar />
      <main>
        <Appear><Hero /></Appear>
        <Appear><TrustStrip /></Appear>
        <Appear><Doctors /></Appear>
        <Appear><ProblemSolution /></Appear>
        <Appear><Services /></Appear>
        <Appear><HowItWorks /></Appear>
        <Appear><Testimonials /></Appear>
        <Appear><Faq /></Appear>
        <Appear><ProofBar /></Appear>
        <Appear><Team /></Appear>
        <Appear><ClosingCallout /></Appear>
      </main>
      <Footer />
    </div>
  );
}
