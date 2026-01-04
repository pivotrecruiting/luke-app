import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export const Welcome = (): JSX.Element => {
  const [, setLocation] = useLocation();

  return (
    <main className="[background:radial-gradient(50%_50%_at_50%_50%,rgba(10,10,21,1)_0%,rgba(0,0,0,1)_100%)] w-full min-w-[390px] min-h-[844px] relative flex flex-col items-center">
      <img
        className="mt-0 w-[302px] h-52 object-cover"
        alt="Nordic style"
        src="/figmaAssets/nordic-style-colorful-metal-pendant-light-fixture-dining-room-ta.png"
      />

      <div className="absolute top-[155px] left-[99px] w-[195px] h-[436px] bg-[#616ac94c] rounded-[97.5px/218px] blur-[100px]" />

      <h1 className="absolute top-[385px] left-2.5 w-[370px] h-4 flex items-center justify-center [text-shadow:0px_-6px_4px_#00000033] [font-family:'Inter',Helvetica] font-extrabold text-white text-[25px] text-center tracking-[0] leading-5 whitespace-nowrap">
        Bring Licht in deine Finanzen
      </h1>

      <p className="absolute top-[417px] left-[27px] w-[350px] h-4 flex items-center justify-center [font-family:'Inter',Helvetica] font-medium text-[#ffffffcc] text-base text-center tracking-[0] leading-5 whitespace-nowrap">
        Einfach. Klar. Transparent.
      </p>

      <Button 
        onClick={() => setLocation("/signup")}
        className="absolute top-[747px] left-5 w-[350px] h-auto bg-[#7340fd] rounded-[32px] shadow-[inset_0px_9px_6.3px_#8c62fe52,0px_4px_40px_#2a39e6b0] px-6 py-4"
        data-testid="cta-button"
      >
        <span className="[font-family:'Manrope',Helvetica] font-extrabold text-neutral-50 text-sm tracking-[0] leading-[22px] whitespace-nowrap">
          7 TAGE KOSTENLOS TESTEN
        </span>
      </Button>
    </main>
  );
};
