import React from "react";
import { useTranslation } from "react-i18next";
import { GradientHeading } from "@/components/ui/GradientHeading";
import { GoldButton } from "@/components/ui/GoldButton";
import chzLogo from "@assets/CHZ_1776150749884.png";

export const HeroTextBlock: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="w-full xl:flex-1 xl:min-w-0 flex flex-col gap-6">
      <GradientHeading
        as="h2"
        className="text-[38px] sm:text-[52px] lg:text-[63px] leading-[108%]"
        style={{ letterSpacing: "0.8px" }}
      >
        {t('hero.heading1')}
        <br />
        {t('hero.heading2')}
      </GradientHeading>

      <div className="flex flex-col gap-4">
        <p className="font-golos text-[16px] sm:text-[18px] leading-[1.6] text-white/70">
          {t('hero.body1')}
        </p>
        <p className="font-golos text-[16px] sm:text-[18px] leading-[1.6] text-white/70">
          {t('hero.body2')}
        </p>
      </div>

      <div className="flex flex-wrap gap-3 sm:gap-4 mt-2">
        <GoldButton className="text-sm sm:text-base">{t('hero.exploreCta')}</GoldButton>
        <button className="px-5 sm:px-7 py-3 sm:py-3.5 rounded-full border border-white/20 bg-white/5 text-white font-jura font-bold text-sm sm:text-base uppercase tracking-wide hover:bg-white/10 transition-all">
          {t('hero.howItWorksCta')}
        </button>
      </div>

      <div className="flex flex-col gap-2 mt-2">
        <div className="flex items-center gap-2">
          <img
            src={import.meta.env.BASE_URL + "icons/polymart.svg"}
            alt="Polymarket"
            className="w-5 h-5"
          />
          <span className="font-golos text-sm text-white/50">
            {t('hero.polymarketPartner')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <img
            src={chzLogo}
            alt="Chiliz"
            className="w-5 h-5 rounded-full"
          />
          <span className="font-golos text-sm text-white/50">
            {t('hero.chilizPartner')}
          </span>
        </div>
      </div>
    </div>
  );
};
