import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useLocation } from "wouter";
import coinsImg from "@assets/image_1767541830063.png";
import ellipseBg from "@assets/image_1767542218268.png";

export const Onboarding2 = (): JSX.Element => {
  const [, setLocation] = useLocation();
  const [amount, setAmount] = useState("0,00");

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9,]/g, "");
    setAmount(value);
  };

  return (
    <main className="bg-white w-full min-w-[390px] min-h-[844px] relative flex flex-col items-center px-5 py-8">
      <div className="flex items-center gap-2 mt-4">
        <div className="w-2 h-2 bg-gray-300 rounded-full" />
        <div className="w-8 h-2 bg-[#7B8CDE] rounded-full" />
        <div className="w-2 h-2 bg-gray-300 rounded-full" />
        <div className="w-2 h-2 bg-gray-300 rounded-full" />
        <div className="w-2 h-2 bg-gray-300 rounded-full" />
      </div>
      <div className="mt-6 w-full">
        <h1 className="[font-family:'Inter',Helvetica] font-bold text-black text-[28px] leading-tight">
          Hast du bereits etwas
        </h1>
        <h1 className="[font-family:'Inter',Helvetica] font-bold text-black text-[28px] leading-tight">
          erspartes?
        </h1>
        <p className="mt-3 [font-family:'Inter',Helvetica] font-normal text-gray-400 text-base italic">
          jeder Cent zählt.
        </p>
      </div>
      <div className="relative w-full flex justify-center mt-6" style={{ height: '200px' }}>
        <img 
          src={ellipseBg} 
          alt="" 
          className="absolute"
          style={{ width: '200px', height: '170px', top: '25px', left: '50%', transform: 'translateX(-50%)' }}
        />
        <img 
          src={coinsImg} 
          alt="Coins illustration" 
          className="absolute z-10 ml-[10px] mr-[10px]"
          style={{ width: '210px', top: '0px', left: '50%', transform: 'translateX(-50%)' }}
        />
      </div>
      <div className="mt-6 w-full">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 [font-family:'Inter',Helvetica] text-gray-500 text-lg">€</span>
          <Input
            type="text"
            value={amount}
            onChange={handleAmountChange}
            className="w-full h-14 pl-10 rounded-xl border-[#7B8CDE] border-2 [font-family:'Inter',Helvetica] text-lg text-gray-700"
            data-testid="amount-input"
          />
        </div>
      </div>
      <div className="mt-auto w-full flex flex-col gap-3 pb-8">
        <Button
          onClick={() => setLocation("/onboarding3")}
          variant="outline"
          className="w-full h-14 rounded-2xl border-[#7B8CDE] bg-[#E8E4F3] [font-family:'Inter',Helvetica] font-semibold text-[#7B8CDE] text-base"
          data-testid="skip-button"
        >
          Nein, hab ich nicht
        </Button>

        <Button
          onClick={() => setLocation("/onboarding3")}
          className="w-full h-14 bg-[#8E97FD] rounded-2xl [font-family:'Inter',Helvetica] font-bold text-white text-base"
          data-testid="continue-button"
        >
          WEITER
        </Button>
      </div>
    </main>
  );
};
