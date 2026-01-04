import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import { useLocation } from "wouter";

export const SignUp = (): JSX.Element => {
  const [, setLocation] = useLocation();

  return (
    <main className="bg-white w-full min-w-[390px] min-h-[844px] relative flex flex-col items-center overflow-hidden">
      <div className="absolute top-[-50px] left-[-80px] w-[200px] h-[200px] bg-[#2d9a8c] rounded-full blur-[60px] opacity-60" />

      <div className="absolute bottom-[-50px] right-[-80px] w-[200px] h-[200px] bg-[#7340fd] rounded-full blur-[60px] opacity-50" />

      <div className="mt-20 flex items-center gap-2">
        <h1 className="[font-family:'Inter',Helvetica] font-bold text-black text-3xl">
          Luke
        </h1>
      </div>

      <div className="mt-16 flex flex-col items-center px-6 w-full max-w-[350px]">
        <h2 className="[font-family:'Inter',Helvetica] font-bold text-black text-xl text-center">
          Create an account
        </h2>
        <p className="mt-2 [font-family:'Inter',Helvetica] font-normal text-gray-500 text-sm text-center">
          Enter your email to sign up for this app
        </p>

        <Input
          type="email"
          placeholder="email@domain.com"
          className="mt-8 w-full h-12 rounded-lg border-gray-300 [font-family:'Inter',Helvetica]"
          data-testid="email-input"
        />

        <Button 
          onClick={() => setLocation("/onboarding1")}
          className="mt-4 w-full h-12 bg-[#7340fd] rounded-lg [font-family:'Inter',Helvetica] font-semibold text-white"
          data-testid="continue-button"
        >
          Continue
        </Button>

        <div className="mt-6 flex items-center w-full">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="px-4 [font-family:'Inter',Helvetica] text-gray-400 text-sm">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <Button 
          variant="outline"
          className="mt-6 w-full h-12 rounded-lg border-gray-300 [font-family:'Inter',Helvetica] font-medium text-black flex items-center justify-center gap-2"
          data-testid="google-login-button"
        >
          <FcGoogle className="w-5 h-5" />
          Continue with Google
        </Button>

        <Button 
          variant="outline"
          className="mt-3 w-full h-12 rounded-lg border-gray-300 [font-family:'Inter',Helvetica] font-medium text-black flex items-center justify-center gap-2"
          data-testid="apple-login-button"
        >
          <FaApple className="w-5 h-5" />
          Continue with Apple
        </Button>

        <p className="mt-8 [font-family:'Inter',Helvetica] text-gray-500 text-xs text-center leading-5">
          By clicking continue, you agree to our{" "}
          <a href="#" className="text-black underline" data-testid="terms-link">Terms of Service</a>
          {" "}and{" "}
          <a href="#" className="text-black underline" data-testid="privacy-link">Privacy Policy</a>
        </p>
      </div>
    </main>
  );
};
