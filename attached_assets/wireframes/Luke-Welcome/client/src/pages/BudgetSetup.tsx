import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";

const categories = [
  "Essen & Trinken", "Feiern", "Shoppen", "Sprit", "Auswärts essen",
  "Freizeit", "Events", "Mobilität", "Coffee 2 go", "Ausgang"
];

const amounts = [10, 20, 30, 50, 100, 150, 200, 250, 300, 400, 500];

export const BudgetSetup = (): JSX.Element => {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("Shoppen");
  const [selectedAmountIndex, setSelectedAmountIndex] = useState(3);
  const scrollRef = useRef<HTMLDivElement>(null);

  const itemHeight = 44;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = selectedAmountIndex * itemHeight;
    }
  }, []);

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollTop = scrollRef.current.scrollTop;
      const newIndex = Math.round(scrollTop / itemHeight);
      if (newIndex >= 0 && newIndex < amounts.length && newIndex !== selectedAmountIndex) {
        setSelectedAmountIndex(newIndex);
      }
    }
  };

  const selectAmount = (index: number) => {
    setSelectedAmountIndex(index);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: index * itemHeight,
        behavior: 'smooth'
      });
    }
  };

  return (
    <main className="bg-white w-full min-w-[390px] min-h-[844px] relative flex flex-col items-center px-5 py-8">
      <div className="flex items-center gap-2 mt-4">
        <div className="w-2 h-2 bg-gray-300 rounded-full" />
        <div className="w-2 h-2 bg-gray-300 rounded-full" />
        <div className="w-8 h-2 bg-[#7B8CDE] rounded-full" />
        <div className="w-2 h-2 bg-gray-300 rounded-full" />
        <div className="w-2 h-2 bg-gray-300 rounded-full" />
      </div>

      <div className="mt-6 w-full">
        <h1 className="[font-family:'Inter',Helvetica] font-bold text-black text-[28px] leading-tight">
          Wofür gibst du aktuell
        </h1>
        <h1 className="[font-family:'Inter',Helvetica] font-bold text-black text-[28px] leading-tight">
          am meisten Geld aus?
        </h1>
        <p className="mt-3 [font-family:'Inter',Helvetica] font-normal text-gray-400 text-base">
          Wähle einen Bereich den wir gemeinsam zählen
        </p>
      </div>

      <div className="mt-8 w-full overflow-x-auto">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full border-2 [font-family:'Inter',Helvetica] text-sm font-medium transition-colors whitespace-nowrap ${
                selectedCategory === category
                  ? "border-black bg-[#E9E1FF] text-black"
                  : "border-gray-200 bg-[#E9E1FF] text-gray-600"
              }`}
              data-testid={`category-${category.toLowerCase().replace(/\s/g, '-')}`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 w-full text-center">
        <p className="[font-family:'Inter',Helvetica] font-normal text-gray-600 text-base">
          Dein monatliches Limit für <span className="font-bold">{selectedCategory}</span>:
        </p>
      </div>

      <div className="mt-6 relative w-full flex justify-center">
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-[220px] overflow-y-auto scrollbar-hide relative"
          style={{ scrollSnapType: 'y mandatory', WebkitOverflowScrolling: 'touch' }}
        >
          <div style={{ height: `${itemHeight * 2}px` }} />
          
          {amounts.map((amount, index) => (
            <div
              key={amount}
              onClick={() => selectAmount(index)}
              className={`h-[44px] flex items-center justify-center cursor-pointer ${
                index === selectedAmountIndex
                  ? "[font-family:'Inter',Helvetica] font-bold text-black text-2xl"
                  : "[font-family:'Inter',Helvetica] font-normal text-gray-400 text-xl"
              }`}
              style={{ scrollSnapAlign: 'center' }}
            >
              {index === selectedAmountIndex ? `€ ${amount}` : amount}
            </div>
          ))}
          
          <div style={{ height: `${itemHeight * 2}px` }} />
        </div>
      </div>

      <div className="mt-auto w-full pb-8">
        <Button
          onClick={() => setLocation("/dashboard")}
          className="w-full h-14 bg-[#8E97FD] rounded-2xl [font-family:'Inter',Helvetica] font-bold text-white text-base"
          data-testid="continue-button"
        >
          WEITER
        </Button>
      </div>
    </main>
  );
};
