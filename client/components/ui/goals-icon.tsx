import React from "react";
import Svg, { Path, G, Mask, Rect } from "react-native-svg";

type GoalsIconPropsT = {
  size?: number;
  color?: string;
};

/**
 * Goals icon component for navigation tabs.
 */
export function GoalsIcon({ size = 24, color = "#1C1B1F" }: GoalsIconPropsT) {
  return (
    <Svg width={size} height={size} viewBox="0 0 73 54" fill="none">
      <Mask
        id="mask0_1660_901"
        style={{ maskType: "alpha" }}
        maskUnits="userSpaceOnUse"
        x="24"
        y="8"
        width="25"
        height="24"
      >
        <Rect x="24.3999" y="8" width="24" height="24" fill="#D9D9D9" />
      </Mask>
      <G mask="url(#mask0_1660_901)">
        <Path
          d="M32.9943 21.1558L34.4558 22.1385L36.4 21.1538L38.3443 22.1385L39.775 21.1865L38.7655 19.173C38.7398 19.1218 38.7013 19.0802 38.65 19.048C38.5987 19.016 38.5442 19 38.4865 19H34.2423C34.1846 19 34.1318 19.016 34.0838 19.048C34.0356 19.0802 33.9987 19.1218 33.973 19.173L32.9943 21.1558ZM29.625 28H43.15L40.4443 22.5442L38.4558 23.8615L36.4 22.8463L34.3443 23.8615L32.3155 22.5192L29.625 28ZM27.2078 29.5L32.6155 18.5098C32.7693 18.2084 32.9927 17.9648 33.2855 17.779C33.5785 17.593 33.8974 17.5 34.2423 17.5H35.65V10.5H41.996L41.1213 12.25L41.996 14H37.15V17.5H38.4673C38.8121 17.5 39.1268 17.5904 39.4115 17.7712C39.6962 17.9519 39.9205 18.1929 40.0845 18.4943L45.5923 29.5H27.2078Z"
          fill={color}
        />
      </G>
    </Svg>
  );
}
