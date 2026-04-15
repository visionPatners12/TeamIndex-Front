export interface FaqItem {
  question: string;
  answer: string;
  defaultOpen?: boolean;
}

export const FAQS: FaqItem[] = [
  {
    question: "What is a Team Index?",
    answer:
      "A live team-based index connected to a pool deployed on Polymarket. It gives fans continuous exposure to their team's performance across multiple prediction markets, rather than a single match bet.",
    defaultOpen: true,
  },
  {
    question: "Where is the capital placed?",
    answer:
      "Capital is deployed across Polymarket match and futures markets directly linked to the selected team — including win/loss markets, competition advancement, and season-long outcomes.",
  },
  {
    question: "What drives performance?",
    answer:
      "Performance is driven by how the underlying Polymarket positions resolve. When the team wins and positions settle favorably, the index value increases and gains are reflected in the token price.",
  },
  {
    question: "Why is it different from a normal bet?",
    answer:
      "A normal bet is a single-outcome event. A Team Index is a live pool that takes multiple positions over time, giving you ongoing exposure to team performance — not just one match.",
  },
];
