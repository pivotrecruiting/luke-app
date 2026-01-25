import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import WelcomeScreen from "@/screens/WelcomeScreen";
import SignUpScreen from "@/screens/SignUpScreen";
import OnboardingCurrencyScreen from "@/screens/OnboardingCurrencyScreen";
import Onboarding1Screen from "@/screens/onboarding/Onboarding1Screen";
import Onboarding2Screen from "@/screens/onboarding/Onboarding2Screen";
import Onboarding3Screen from "@/screens/onboarding/Onboarding3Screen";
import Onboarding4Screen from "@/screens/onboarding/Onboarding4Screen";
import Onboarding5Screen from "@/screens/onboarding/Onboarding5Screen";
import Onboarding6Screen from "@/screens/onboarding/Onboarding6Screen";
import Onboarding7Screen from "@/screens/onboarding/Onboarding7Screen";
import PaywallScreen from "@/screens/PaywallScreen";

export type OnboardingStackParamList = {
  Welcome: undefined;
  SignUp: undefined;
  OnboardingCurrency: undefined;
  Onboarding1: undefined;
  Onboarding2: undefined;
  Onboarding3: undefined;
  Onboarding4: undefined;
  Onboarding5: undefined;
  Onboarding6: undefined;
  Onboarding7: undefined;
  Paywall: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export default function OnboardingNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen
        name="OnboardingCurrency"
        component={OnboardingCurrencyScreen}
      />
      <Stack.Screen name="Onboarding1" component={Onboarding1Screen} />
      <Stack.Screen name="Onboarding2" component={Onboarding2Screen} />
      <Stack.Screen name="Onboarding3" component={Onboarding3Screen} />
      <Stack.Screen name="Onboarding4" component={Onboarding4Screen} />
      <Stack.Screen name="Onboarding5" component={Onboarding5Screen} />
      <Stack.Screen name="Onboarding6" component={Onboarding6Screen} />
      <Stack.Screen name="Onboarding7" component={Onboarding7Screen} />
      <Stack.Screen name="Paywall" component={PaywallScreen} />
    </Stack.Navigator>
  );
}
