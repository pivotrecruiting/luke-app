import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useLocation } from "wouter";

const incomeTypes = [
  "Gehalt/Lohn", "Selbstständigkeit", "Sonstiges", "Kindergeld",
  "Bafög/Stipendium", "Nebenjob", "Taschengeld", "Unterhalt"
];

export const Onboarding4 = (): JSX.Element => {
  const [, setLocation] = useLocation();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [amount, setAmount] = useState("0,00");

  return (
    <main className="bg-white w-full min-w-[390px] min-h-[844px] relative flex flex-col items-center px-5 py-8">
      <div className="flex items-center gap-2 mt-4">
        <div className="w-2 h-2 bg-gray-300 rounded-full" />
        <div className="w-2 h-2 bg-gray-300 rounded-full" />
        <div className="w-2 h-2 bg-gray-300 rounded-full" />
        <div className="w-8 h-2 bg-[#7B8CDE] rounded-full" />
        <div className="w-2 h-2 bg-gray-300 rounded-full" />
      </div>

      <div className="mt-6 w-full">
        <h1 className="[font-family:'Inter',Helvetica] font-bold text-black text-[28px] leading-tight">
          Was kommt monatlich
        </h1>
        <h1 className="[font-family:'Inter',Helvetica] font-bold text-black text-[28px] leading-tight">
          rein?
        </h1>
        <p className="mt-3 [font-family:'Inter',Helvetica] font-normal text-gray-400 text-base">
          Gib dein durchschnittliches Netto-Einkommen an, damit Luke deinen Spielraum berechnen kann
        </p>
      </div>

      <div className="mt-8 w-full overflow-x-auto">
        <div className="flex flex-wrap gap-2">
          {incomeTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-4 py-2 rounded-full border-2 [font-family:'Inter',Helvetica] text-sm font-medium transition-colors whitespace-nowrap ${
                selectedType === type
                  ? "border-black bg-[#E9E1FF] text-black"
                  : "border-gray-200 bg-[#E9E1FF] text-gray-600"
              }`}
              data-testid={`type-${type.toLowerCase().replace(/\//g, '-')}`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto w-full mb-8">
        <div className="relative mb-12">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 [font-family:'Inter',Helvetica] text-gray-500">€</span>
          <Input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9,]/g, ""))}
            className="w-full h-14 pl-10 rounded-xl border-[#7B8CDE] border-2 [font-family:'Inter',Helvetica] text-base text-gray-700"
            data-testid="amount-input"
          />
        </div>

        <Button
          onClick={() => setLocation("/onboarding5")}
          className="w-full h-14 bg-[#8E97FD] rounded-2xl [font-family:'Inter',Helvetica] font-bold text-white text-base"
          data-testid="continue-button"
        >
          WEITER
        </Button>
      </div>
    </main>
  );
};
