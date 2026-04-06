import { HeroSection } from "@/components/sections/HeroSection";
import { StatsSection } from "@/components/sections/StatsSection";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { FeaturesGrid } from "@/components/sections/FeaturesGrid";
import { SecuritySection } from "@/components/sections/SecuritySection";
import { BountyPreview } from "@/components/sections/BountyPreview";
import { BuildSection } from "@/components/sections/BuildSection";
import { CTASection } from "@/components/sections/CTASection";

export default function Home() {
  return (
    <>
      <HeroSection />
      <StatsSection />
      <HowItWorks />
      <FeaturesGrid />
      <SecuritySection />
      <BountyPreview />
      <BuildSection />
      <CTASection />
    </>
  );
}
