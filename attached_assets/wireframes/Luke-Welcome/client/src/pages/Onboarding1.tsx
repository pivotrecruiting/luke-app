import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useLocation } from "wouter";
import overviewImg from "@assets/image_1767540420128.png";
import klarnaImg from "@assets/image_1767540689248.png";
import abosImg from "@assets/image_1767540704833.png";
import savingsImg from "@assets/image_1767540547771.png";
import goalsImg from "@assets/image_1767540578781.png";
import peaceImg from "@assets/image_1767540595139.png";
import abosBgImg from "@assets/image_1767540753145.png";
import klarnaBgImg from "@assets/image_1767540791135.png";
import savingsBgImg from "@assets/image_1767540818069.png";
import goalsBgImg from "@assets/image_1767540875683.png";
import peaceBgImg from "@assets/image_1767540893035.png";

const goals = [
  { id: "overview", label: "Überblick\ngewinnen", color: "bg-[#7B8CDE]", image: overviewImg, bgImage: null, bgStyle: {} },
  { id: "klarna", label: "Klarna & Raten\nim Griff haben", color: "bg-[#F07B6E]", image: klarnaImg, bgImage: klarnaBgImg, bgStyle: { width: '118px', height: '67px', top: '20px', left: '30px' } },
  { id: "subscriptions", label: "Abos\noptimieren", color: "bg-[#F5C5A8]", image: abosImg, bgImage: abosBgImg, bgStyle: { width: '100%', height: 'auto', bottom: '0', left: '0' } },
  { id: "savings", label: "Notgroschen\naufbauen", color: "bg-[#F5D76E]", image: savingsImg, bgImage: savingsBgImg, bgStyle: { width: '100px', height: '60px', top: '20px', right: '10px' } },
  { id: "goals", label: "Sparziel\nerreichen", color: "bg-[#7ECBA1]", image: goalsImg, bgImage: goalsBgImg, bgStyle: { width: '80px', height: 'auto', top: '10px', left: '10px' } },
  { id: "peace", label: "Finanzielle Ruhe", color: "bg-[#D4B5C7]", image: peaceImg, bgImage: peaceBgImg, bgStyle: { width: '120px', height: 'auto', top: '10px', right: '0' } },
];

export const Onboarding1 = (): JSX.Element => {
  const [, setLocation] = useLocation();
  const [selected, setSelected] = useState<string[]>([]);

  const toggleSelection = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <main className="bg-white w-full min-w-[390px] min-h-[844px] relative flex flex-col items-center px-5 py-8">
      <div className="flex items-center gap-2 mt-4">
        <div className="w-8 h-2 bg-[#7B8CDE] rounded-full" />
        <div className="w-2 h-2 bg-gray-300 rounded-full" />
        <div className="w-2 h-2 bg-gray-300 rounded-full" />
        <div className="w-2 h-2 bg-gray-300 rounded-full" />
        <div className="w-2 h-2 bg-gray-300 rounded-full" />
      </div>

      <div className="mt-6 w-full">
        <h1 className="[font-family:'Inter',Helvetica] font-bold text-black text-[28px] leading-tight">
          Was bringt dich
        </h1>
        <h1 className="[font-family:'Inter',Helvetica] font-normal text-black text-[28px] leading-tight">
          zu Luke?
        </h1>
        <p className="mt-3 [font-family:'Inter',Helvetica] font-normal text-gray-400 text-base">
          wähle mindestens eines der folgenden:
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 w-full">
        {goals.map((goal) => (
          <button
            key={goal.id}
            onClick={() => toggleSelection(goal.id)}
            className={`${goal.color} rounded-2xl p-4 h-[160px] flex flex-col justify-between items-start text-left transition-all relative overflow-hidden ${
              selected.includes(goal.id)
                ? "ring-4 ring-[#7340fd] ring-offset-2"
                : ""
            }`}
            data-testid={`goal-${goal.id}`}
          >
            {goal.bgImage && (
              <img 
                src={goal.bgImage} 
                alt="" 
                className="absolute object-contain"
                style={goal.bgStyle}
              />
            )}
            {goal.image && (
              <img 
                src={goal.image} 
                alt={goal.label} 
                className="w-full h-20 object-contain mx-auto relative z-10"
              />
            )}
            <span className="[font-family:'Inter',Helvetica] font-bold text-white text-lg whitespace-pre-line leading-tight mt-auto relative z-10">
              {goal.label}
            </span>
          </button>
        ))}
      </div>

      <Button
        onClick={() => setLocation("/onboarding2")}
        className="mt-8 w-full h-14 bg-[#8E97FD] rounded-2xl [font-family:'Inter',Helvetica] font-bold text-white text-base"
        data-testid="continue-button"
      >
        WEITER
      </Button>
    </main>
  );
};
