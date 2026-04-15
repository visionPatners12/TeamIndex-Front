import React from "react";
import { useTranslation } from "react-i18next";
import { HowItWorksStep } from "./HowItWorksStep";
import { GradientHeading } from "@/components/ui/GradientHeading";

export const HowItWorksSection: React.FC = () => {
  const { t } = useTranslation();

  const steps = [
    { number: "01", title: t('howItWorks.step1Title'), description: t('howItWorks.step1Desc') },
    { number: "02", title: t('howItWorks.step2Title'), description: t('howItWorks.step2Desc') },
    { number: "03", title: t('howItWorks.step3Title'), description: t('howItWorks.step3Desc') },
    { number: "04", title: t('howItWorks.step4Title'), description: t('howItWorks.step4Desc') },
  ];

  return (
    <section
      className="w-full flex flex-col items-center py-20 px-4 sm:px-10 lg:px-30 gap-16"
      style={{
        background:
          "radial-gradient(141.42% 70.71% at 50% 0%, rgba(254, 180, 19, 0.08) 0%, rgba(254, 180, 19, 0.00) 60%)",
      }}
    >
      <GradientHeading
        as="h2"
        className="text-[38px] sm:text-[52px] xl:text-[63px] leading-[108%] text-center"
        style={{ letterSpacing: "0.8px" }}
      >
        {t('howItWorks.heading')}
      </GradientHeading>
      <div className="relative grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-10 xl:gap-15 w-full max-w-7xl">
        <div
          className="hidden xl:block absolute left-0 right-0 top-6 h-px z-0"
          style={{
            background: "linear-gradient(90deg, rgba(255,255,255,0.01) 0%, rgba(255,255,255,0.10) 46.15%, rgba(255,255,255,0.01) 100%)",
            maskImage: "repeating-linear-gradient(90deg, black 0px, black 6px, transparent 6px, transparent 12px)",
            WebkitMaskImage: "repeating-linear-gradient(90deg, black 0px, black 6px, transparent 6px, transparent 12px)",
          }}
        />
        {steps.map((step) => (
          <div key={step.number} className="relative z-10 flex flex-col items-center">
            <HowItWorksStep {...step} />
          </div>
        ))}
      </div>
    </section>
  );
};
