import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import WelcomeScreen from "@/screens/WelcomeScreen";
import SignUpScreen from "@/screens/SignUpScreen";
import Onboarding1Screen from "@/screens/Onboarding1Screen";
import Onboarding2Screen from "@/screens/Onboarding2Screen";
import Onboarding3Screen from "@/screens/Onboarding3Screen";
import Onboarding4Screen from "@/screens/Onboarding4Screen";
import Onboarding5Screen from "@/screens/Onboarding5Screen";
import Onboarding6Screen from "@/screens/Onboarding6Screen";

export type OnboardingStackParamList = {
  Welcome: undefined;
  SignUp: undefined;
  Onboarding1: undefined;
  Onboarding2: undefined;
  Onboarding3: undefined;
  Onboarding4: undefined;
  Onboarding5: undefined;
  Onboarding6: undefined;
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
      <Stack.Screen name="Onboarding1" component={Onboarding1Screen} />
      <Stack.Screen name="Onboarding2" component={Onboarding2Screen} />
      <Stack.Screen name="Onboarding3" component={Onboarding3Screen} />
      <Stack.Screen name="Onboarding4" component={Onboarding4Screen} />
      <Stack.Screen name="Onboarding5" component={Onboarding5Screen} />
      <Stack.Screen name="Onboarding6" component={Onboarding6Screen} />
    </Stack.Navigator>
  );
}
