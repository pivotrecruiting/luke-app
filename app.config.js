const appJson = require("./app.json");

module.exports = ({ config }) => {
  const expoConfig = appJson.expo ?? {};
  const googleIosUrlScheme =
    process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME?.trim() ?? "";
  const plugins = [...(expoConfig.plugins ?? [])];

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
    plugins,
  };
};
