const appJson = require("./app.json");

module.exports = ({ config }) => {
  const expoConfig = appJson.expo ?? {};
  const googleIosUrlScheme =
    process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME?.trim() ?? "";
  const easProjectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim() ?? "";
  const plugins = [...(expoConfig.plugins ?? [])];
  const extra = {
    ...(expoConfig.extra ?? {}),
    eas: {
      ...((expoConfig.extra ?? {}).eas ?? {}),
      ...(easProjectId ? { projectId: easProjectId } : {}),
    },
  };

  if (googleIosUrlScheme) {
    plugins.push([
      "@react-native-google-signin/google-signin",
      {
        iosUrlScheme: googleIosUrlScheme,
      },
    ]);
  }

  return {
    ...config,
    ...expoConfig,
    extra,
    plugins,
  };
};
