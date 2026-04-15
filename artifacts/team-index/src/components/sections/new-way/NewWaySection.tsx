import React from "react";
import { useTranslation } from "react-i18next";
import { FeatureCard } from "./FeatureCard";
import { GradientHeading } from "@/components/ui/GradientHeading";

export const NewWaySection: React.FC = () => {
  const { t } = useTranslation();
  return (
    <section className="relative w-full bg-[#0D0A06] py-16 sm:py-24 px-4 sm:px-10 lg:px-30 flex flex-col items-center gap-10 sm:gap-14 overflow-hidden">
      <GradientHeading className="relative text-5xl md:text-6xl text-center">
        {t('newWay.heading')}
      </GradientHeading>

      <div className="relative flex flex-col items-center gap-4 -mt-4">
        <p className="font-golos text-base text-white/70 text-center max-w-xl leading-relaxed">
          {t('newWay.body')}
        </p>
        <p className="font-golos text-sm text-white/50 text-center">{t('newWay.exposureIncludes')}</p>
      </div>

      <div className="relative flex flex-col md:flex-row gap-6 w-full max-w-4xl justify-center items-stretch">
        <FeatureCard
          icon={import.meta.env.BASE_URL + "icons/anw01.svg"}
          title={t('newWay.matchMarketsTitle')}
          description={t('newWay.matchMarketsDesc')}
        />
        <FeatureCard
          icon={import.meta.env.BASE_URL + "icons/anw02.svg"}
          title={t('newWay.futuresMarketsTitle')}
          description={t('newWay.futuresMarketsDesc')}
        />
      </div>

      <p className="relative font-golos text-white/40 text-sm text-center max-w-lg">
        {t('newWay.dynamicNote')}
      </p>
    </section>
  );
};
