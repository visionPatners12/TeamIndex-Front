export interface FaqItem {
  question: string;
  answer: string;
  defaultOpen?: boolean;
}

export const FAQS: FaqItem[] = [
  {
    question: "What do I own?",
    answer:
      "You own an index token. It represents your on-chain share of a team pool.",
    defaultOpen: true,
  },
  {
    question: "What is the pool?",
    answer:
      "A pool is a shared vault for one team index. When you enter, you receive pool-share tokens tied to that vault.",
  },
  {
    question: "How is value tracked?",
    answer:
      "The app reads the pool value and your index token balance, then shows your estimated share value in your wallet view.",
  },
  {
    question: "What risks exist?",
    answer:
      "Team Index is experimental. Markets can move quickly, and pool values can go down as well as up.",
  },
];
