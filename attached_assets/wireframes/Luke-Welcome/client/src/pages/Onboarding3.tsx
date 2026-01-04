import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useLocation } from "wouter";

const savingsGoals = [
  "Urlaub", "Führerschein", "Wohnung", "Hochzeit",
  "Schuldenfrei", "Notgroschen", "Uhr", "Auto", "Weihnachten",
  "Vespa", "Handy", "Bildschirm", "Laptop", "Klarna"
];

const goalEmojis: Record<string, string> = {
  "Urlaub": "🏖️",
  "Führerschein": "🚗",
  "Wohnung": "😊",
  "Hochzeit": "💒",
  "Schuldenfrei": "💳",
  "Notgroschen": "🐷",
  "Uhr": "⌚",
  "Auto": "🚙",
  "Weihnachten": "🎄",
  "Vespa": "🛵",
  "Handy": "📱",
  "Bildschirm": "🖥️",
  "Laptop": "💻",
  "Klarna": "💰"
};

export const Onboarding3 = (): JSX.Element => {
  const [, setLocation] = useLocation();
  const [selectedGoal, setSelectedGoal] = useState("Wohnung");
  const [amount, setAmount] = useState("1000,00");
  const [monthlyAmount, setMonthlyAmount] = useState("200,00");

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
          Worauf sparst du?
        </h1>
        <p className="mt-3 [font-family:'Inter',Helvetica] font-normal text-gray-400 text-base">
          Dein erstes Ziel gibt deiner Reise eine{"\n"}Richtung
        </p>
      </div>
      <div className="mt-8 w-full overflow-x-auto">
        <div className="flex flex-wrap gap-2">
          {savingsGoals.map((goal) => (
            <button
              key={goal}
              onClick={() => setSelectedGoal(goal)}
              className={`px-4 py-2 rounded-full border-2 [font-family:'Inter',Helvetica] text-sm font-medium transition-colors whitespace-nowrap ${
                selectedGoal === goal
                  ? "border-black bg-[#E9E1FF] text-black"
                  : "border-gray-200 bg-[#E9E1FF] text-gray-600"
              }`}
              data-testid={`goal-${goal.toLowerCase()}`}
            >
              {goal}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-10 w-full flex flex-col gap-4">
        <div>
          <label className="[font-family:'Inter',Helvetica] text-sm text-gray-600 mb-2 block">
            Name
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">
              {goalEmojis[selectedGoal] || "😊"}
            </span>
            <Input
              type="text"
              value={selectedGoal}
              onChange={(e) => setSelectedGoal(e.target.value)}
              className="w-full h-14 pl-12 rounded-xl border-gray-200 border [font-family:'Inter',Helvetica] text-base text-gray-700"
              data-testid="name-input"
            />
          </div>
        </div>

        <div>
          <label className="[font-family:'Inter',Helvetica] text-sm text-gray-600 mb-2 block">
            Summe
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 [font-family:'Inter',Helvetica] text-gray-500">€</span>
            <Input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9,]/g, ""))}
              className="w-full h-14 pl-10 rounded-xl border-gray-200 border [font-family:'Inter',Helvetica] text-base text-gray-700"
              data-testid="amount-input"
            />
          </div>
        </div>

        <div>
          <label className="[font-family:'Inter',Helvetica] text-sm text-gray-600 mb-2 block">
            Monatlicher Beitrag
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 [font-family:'Inter',Helvetica] text-gray-500">€</span>
            <Input
              type="text"
              value={monthlyAmount}
              onChange={(e) => setMonthlyAmount(e.target.value.replace(/[^0-9,]/g, ""))}
              className="w-full h-14 pl-10 rounded-xl border-gray-200 border [font-family:'Inter',Helvetica] text-base text-gray-700"
              data-testid="monthly-input"
            />
          </div>
        </div>
      </div>
      <div className="mt-auto w-full pt-[20px] pb-[20px]">
        <Button
          onClick={() => setLocation("/onboarding4")}
          className="w-full h-14 bg-[#8E97FD] rounded-2xl [font-family:'Inter',Helvetica] font-bold text-white text-base"
          data-testid="continue-button"
        >
          WEITER
        </Button>
      </div>
    </main>
  );
};
