import React from "react";
import { useTranslation } from "react-i18next";
import { GradientHeading } from "@/components/ui/GradientHeading";
import { WhyDifferentItem } from "./WhyDifferentItem";

export const WhyDifferentSection: React.FC = () => {
  const { t } = useTranslation();

  const items = [
    { iconUrl: import.meta.env.BASE_URL + "icons/wif01.svg", title: t('whyDifferent.item1Title'), description: t('whyDifferent.item1Desc') },
    { iconUrl: import.meta.env.BASE_URL + "icons/wif02.svg", title: t('whyDifferent.item2Title'), description: t('whyDifferent.item2Desc') },
    { iconUrl: import.meta.env.BASE_URL + "icons/wif03.svg", title: t('whyDifferent.item3Title'), description: t('whyDifferent.item3Desc') },
    { iconUrl: import.meta.env.BASE_URL + "icons/wif04.svg", title: t('whyDifferent.item4Title'), description: t('whyDifferent.item4Desc') },
  ];

  return (
    <section className="relative w-full py-20 px-4 sm:px-10 lg:px-[120px] bg-[#0D0A06]  overflow-hidden">
      <img
        src={import.meta.env.BASE_URL + "icons/wif-bg.svg"}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none opacity-60"
        alt=""
      />
      <div className="relative z-10 w-full grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
        <div className="lg:sticky lg:top-32">
          <GradientHeading className="text-5xl md:text-6xl lg:text-7xl">
            {t('whyDifferent.heading1')}{" "}
            <br />
            {t('whyDifferent.heading2')}
          </GradientHeading>
        </div>
        <div className="flex flex-col">
          {items.map((item, i) => (
            <WhyDifferentItem
              key={item.title}
              iconUrl={item.iconUrl}
              title={item.title}
              description={item.description}
              isLast={i === items.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
