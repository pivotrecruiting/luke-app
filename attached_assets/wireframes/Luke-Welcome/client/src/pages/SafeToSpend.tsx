import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

const mockData = {
  einkommen: 1218.40,
  fixkosten: 500.00
};

export const SafeToSpend = (): JSX.Element => {
  const [, setLocation] = useLocation();
  
  const verfuegbar = mockData.einkommen - mockData.fixkosten;

  const formatCurrency = (value: number) => {
    return value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

      <div className="mt-6 w-full text-center">
        <h1 className="[font-family:'Inter',Helvetica] font-bold text-black text-[28px] leading-tight">
          Dein monatlicher Spielraum
        </h1>
        <p className="mt-2 [font-family:'Inter',Helvetica] font-normal text-gray-400 text-base">
          Luke hat gerechnet!
        </p>
      </div>

      <div className="mt-10 w-[296px] h-[296px] mx-auto bg-[#F0EFFF] rounded-[24px] border border-[#E5E5E7] p-6 flex flex-col justify-center">
        <div className="flex justify-between items-center py-4 border-b border-[#A1A4B2]">
          <span className="[font-family:'Inter',Helvetica] font-medium text-black text-lg">
            Einkommen
          </span>
          <span className="[font-family:'Inter',Helvetica] font-semibold text-green-500 text-lg">
            + {formatCurrency(mockData.einkommen)}
          </span>
        </div>

        <div className="flex justify-between items-center py-4 border-b border-[#A1A4B2]">
          <span className="[font-family:'Inter',Helvetica] font-medium text-black text-lg">
            Fixkosten
          </span>
          <span className="[font-family:'Inter',Helvetica] font-semibold text-red-500 text-lg">
            - {formatCurrency(mockData.fixkosten)}
          </span>
        </div>

        <div className="mt-6 text-center">
          <span className="[font-family:'Inter',Helvetica] font-bold text-[#7B8CDE] text-5xl">
            + {formatCurrency(verfuegbar)}
          </span>
          <p className="mt-2 [font-family:'Inter',Helvetica] font-medium text-gray-600 text-base">
            Verfügbar
          </p>
        </div>
      </div>

      <p className="mt-8 [font-family:'Inter',Helvetica] font-normal text-gray-400 text-base text-center px-4">
        Das ist das Geld, das dir zum Leben, Sparen und für deine Budgets bleibt.
      </p>

      <div className="mt-auto w-full pb-8">
        <Button
          onClick={() => setLocation("/budget-setup")}
          className="w-full h-14 bg-[#8E97FD] rounded-2xl [font-family:'Inter',Helvetica] font-bold text-white text-base"
          data-testid="budget-button"
        >
          BUDGET FESTLEGEN
        </Button>
      </div>
    </main>
  );
};
