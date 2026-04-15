import React from "react";
import { useTranslation } from "react-i18next";
import { GradientHeading } from "@/components/ui/GradientHeading";

export const SimpleSmartSection: React.FC = () => {
  const { t } = useTranslation();

  const steps = [
    { number: "01", label: t('simpleSmart.step1') },
    { number: "02", label: t('simpleSmart.step2') },
    { number: "03", label: t('simpleSmart.step3') },
    { number: "04", label: t('simpleSmart.step4') },
  ];

  return (
    <section
      className="w-full py-24 px-4 sm:px-10 lg:px-30"
      style={{
        background: "radial-gradient(ellipse at 50% 50%, rgba(254, 180, 19, 0.10) 0%, rgba(254, 180, 19, 0.00) 70%), #0D0A06",
      }}
    >
      <div className="w-full flex flex-col items-center gap-10 text-center">
        <GradientHeading
          as="h2"
          className="text-[32px] sm:text-5xl lg:text-7xl leading-tight"
          style={{ letterSpacing: "0.8px" }}
        >
          <span>{t('simpleSmart.heading1')}</span>
          <span>{t('simpleSmart.heading2')}</span>
        </GradientHeading>

        <p className="font-golos text-sm text-white/50 -mt-4">
          {t('simpleSmart.subtitle')}
        </p>

        <div className="w-full flex flex-col sm:flex-row gap-4">
          {steps.map((step) => (
            <div
              key={step.number}
              className="flex-1 flex items-center gap-3 px-5 py-4 rounded-full border border-[#3f392b] bg-[#292313]"
            >
              <span className="shrink-0 inline-flex items-center justify-center p-3 rounded-2xl border border-white/10 bg-white/5 font-jura font-bold text-md text-[#FEB413]">
                {step.number}
              </span>
              <span className="font-golos text-sm text-white/70 leading-snug text-left">
                {step.label}
              </span>
            </div>
          ))}
        </div>

        <p className="font-golos text-sm text-white/30 max-w-xl leading-relaxed">
          {t('simpleSmart.body')}
        </p>
      </div>
    </section>
  );
};
