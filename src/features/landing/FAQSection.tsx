import { FAQItem } from "./FAQItem";
import { FAQ_ITEMS } from "./content";

interface FAQSectionProps {
  openFAQ: number | null;
  onToggleFAQ: (index: number) => void;
}

export function FAQSection({ openFAQ, onToggleFAQ }: FAQSectionProps) {
  return (
    <section id="faq" className="py-24 px-6 border-t border-border">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
            Frequently asked questions
          </h2>
          <p className="text-lg text-text-muted">
            Everything you need to know about Relay.
          </p>
        </div>
        <div>
          {FAQ_ITEMS.map((item, index) => (
            <FAQItem
              key={item.q}
              item={item}
              isOpen={openFAQ === index}
              onToggle={() => onToggleFAQ(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
