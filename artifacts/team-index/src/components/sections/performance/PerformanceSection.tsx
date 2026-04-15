import React from "react";
import { useTranslation } from "react-i18next";
import { GradientHeading } from "@/components/ui/GradientHeading";

const CheckItem: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex items-start gap-3">
    <img
      src={import.meta.env.BASE_URL + "icons/checkmark-circle-03.svg"}
      alt=""
      aria-hidden="true"
      className="w-5 h-5 shrink-0 mt-0.5"
    />
    <span className="font-golos text-sm text-white/70 leading-relaxed">{text}</span>
  </div>
);

export const PerformanceSection: React.FC = () => {
  const { t } = useTranslation();
  return (
    <section className="w-full py-20 px-4 sm:px-10 lg:px-30 bg-[#0D0A06]">
      <div className="w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">
        <div className="flex flex-col items-center gap-8 border border-[#464137] rounded-2xl p-6 sm:p-8 w-full mx-auto justify-center">
          <div className="w-full max-w-111.75 mx-auto lg:mx-0">
            <img
              src={import.meta.env.BASE_URL + "icons/matrice.svg"}
              alt="Team Index performance matrix"
              className="w-full h-auto"
            />
          </div>
          <div className="flex flex-col gap-4 max-w-md">
            <h3 className="font-jura font-bold text-xl md:text-2xl text-white uppercase tracking-wide leading-snug">
              {t('performance.matrixTitle1')}
              <br />
              {t('performance.matrixTitle2')}
            </h3>
            <p className="font-golos text-sm text-white/50 leading-relaxed">
              {t('performance.matrixBody')}
            </p>
            <p className="font-golos text-sm text-[#FEB413]/80 italic">
              {t('performance.matrixHighlight')}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-8 min-w-0">
          <GradientHeading className="text-4xl lg:text-5xl xl:text-6xl">
            {t('performance.heading')}
          </GradientHeading>

          <p className="font-golos text-base text-white/60 leading-relaxed">
            {t('performance.body')}
          </p>

          <div className="py-1 flex flex-col gap-5">
            <p className="font-golos text-sm text-white/50">
              {t('performance.positionsOn')}
            </p>
            <div className="flex flex-col gap-3">
              <CheckItem text={t('performance.check1')} />
              <CheckItem text={t('performance.check2')} />
              <CheckItem text={t('performance.check3')} />
            </div>
          </div>

          <p className="font-golos text-sm text-white/40 leading-relaxed">
            {t('performance.positionsNote')}
          </p>
        </div>
      </div>
    </section>
  );
};
