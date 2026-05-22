import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GradientHeading } from "@/components/ui/GradientHeading";
import { FAQS } from "@/constants/faqs";

// ─── Accordion item ───────────────────────────────────────────────────────────

const FaqItem: React.FC<{
  question: string;
  answer: string;
  defaultOpen?: boolean;
}> = ({ question, answer, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-white/10 last:border-b-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-6 py-7 text-left focus:outline-none group"
      >
        <span className="font-golos font-semibold text-white text-base sm:text-lg leading-snug group-hover:text-white/80 transition-colors">
          {question}
        </span>
        <span
          className={`shrink-0 text-2xl font-light leading-none transition-colors ${
            open ? "text-[#FEB413]" : "text-white/40 group-hover:text-white"
          }`}
        >
          {open ? "−" : "+"}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="font-golos text-sm text-white/40 leading-relaxed pb-6 pr-10">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Section ─────────────────────────────────────────────────────────────────

export const FaqSection: React.FC = () => (
  <section id="faq" className="w-full py-24 px-4 sm:px-10 lg:px-30 bg-[#0D0A06]">
    <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
      <GradientHeading
        className="text-4xl sm:text-5xl lg:text-6xl max-w-4xl"
      >
        FREQUENTLY ASKED QUESTIONS
      </GradientHeading>

      {/* Right: accordion */}
      <div className="flex flex-col border-t border-white/10">
        {FAQS.map((faq) => (
          <FaqItem
            key={faq.question}
            question={faq.question}
            answer={faq.answer}
            defaultOpen={faq.defaultOpen}
          />
        ))}
      </div>

    </div>
  </section>
);
