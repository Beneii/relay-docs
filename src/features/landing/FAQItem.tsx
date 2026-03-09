import { AnimatePresence, motion } from "motion/react";

interface FAQItemProps {
  item: {
    q: string;
    a: string;
  };
  isOpen: boolean;
  onToggle: () => void;
}

export function FAQItem({ item, isOpen, onToggle }: FAQItemProps) {
  return (
    <div className="border-b border-border">
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between py-5 text-left cursor-pointer"
      >
        <h3
          className={`text-base font-medium pr-4 transition-colors ${
            isOpen ? "text-accent" : "text-text-main"
          }`}
        >
          {item.q}
        </h3>
        <svg
          className={`w-5 h-5 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-accent" : "text-text-muted"
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-text-muted leading-relaxed text-sm">
              {item.a}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
