import {
  Hero,
  CompanyLogos,
  Comparison,
  Testimonials,
  Features,
  Pricing,
  FAQ,
  CTABanner,
} from "@/components/landing";

export default function HomePage() {
  return (
    <>
      <Hero />
      <CompanyLogos />
      <Features />
      <Comparison />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTABanner />
    </>
  );
}
