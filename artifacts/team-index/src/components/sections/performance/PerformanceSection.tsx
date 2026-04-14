import React from "react";
import { GradientHeading } from "@/components/ui/GradientHeading";

// ─── Checkmark item ──────────────────────────────────────────────────────────

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

// ─── Section ─────────────────────────────────────────────────────────────────

export const PerformanceSection: React.FC = () => (
  <section className="w-full py-20 px-4 sm:px-10 lg:px-30 bg-[#0D0A06]">
    <div className="w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">

      {/* ── Left: image + label ─────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-8 border border-[#464137] rounded-2xl p-6 sm:p-8 w-full mx-auto justify-center">
        {/* Matrix graphic */}
        <div className="w-full max-w-111.75 mx-auto lg:mx-0">
          <img
            src={import.meta.env.BASE_URL + "icons/matrice.svg"}
            alt="Team Index performance matrix"
            className="w-full h-auto"
          />
        </div>

        {/* Label block */}
        <div className="flex flex-col gap-4 max-w-md">
          <h3 className="font-jura font-bold text-xl md:text-2xl text-white uppercase tracking-wide leading-snug">
            WHEN THE TEAM PERFORMS,
            <br />
            THE INDEX CAN BENEFIT
          </h3>
          <p className="font-golos text-sm text-white/50 leading-relaxed">
            Strong team outcomes can create value inside the pool when Polymarket positions
            perform well. As positions resolve, gains are reflected in the Team Index.
          </p>
          <p className="font-golos text-sm text-[#FEB413]/80 italic">
            In case of victory, gains are distributed.
          </p>
        </div>
      </div>

      {/* ── Right: heading + content ─────────────────────────────────────── */}
      <div className="flex flex-col gap-8 min-w-0">
        <GradientHeading className="text-4xl lg:text-5xl xl:text-6xl">
          WHERE THE PERFORMANCE COMES FROM
        </GradientHeading>

        <p className="font-golos text-base text-white/60 leading-relaxed">
          Team Index performance is driven by how the pool performs on Polymarket.
        </p>

        <div className="py-1 flex flex-col gap-5">
          <p className="font-golos text-sm text-white/50">
            The pool can take positions on:
          </p>

          <div className="flex flex-col gap-3">
            <CheckItem text="Upcoming team matches" />
            <CheckItem text="Team-related futures opportunities" />
            <CheckItem text="Broader competition outcomes and season-level markets tied to the team" />
          </div>
        </div>

        <p className="font-golos text-sm text-white/40 leading-relaxed">
          As those positions move and settle, the Team Index updates to reflect
          the pool's live performance.
        </p>
      </div>

    </div>
  </section>
);
