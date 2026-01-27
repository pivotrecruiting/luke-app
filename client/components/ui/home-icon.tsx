import React from "react";
import Svg, { Path, G, Mask, Rect } from "react-native-svg";

type HomeIconPropsT = {
  size?: number;
  color?: string;
};

/**
 * Home icon component for navigation tabs.
 */
export function HomeIcon({ size = 24, color = "#1C1B1F" }: HomeIconPropsT) {
  return (
    <Svg width={size} height={size} viewBox="0 0 73 54" fill="none">
      <Mask
        id="mask0_1660_888"
        style={{ maskType: "alpha" }}
        maskUnits="userSpaceOnUse"
        x="24"
        y="8"
        width="25"
        height="24"
      >
        <Rect x="24.3999" y="8" width="24" height="24" fill="#D9D9D9" />
      </Mask>
      <G mask="url(#mask0_1660_888)">
        <Path
          d="M30.3999 26.9997H33.7462V21.0575H39.0537V26.9997H42.3999V17.9997L36.3999 13.4805L30.3999 17.9997V26.9997ZM28.8999 28.4997V17.2497L36.3999 11.6055L43.8999 17.2497V28.4997H37.5537V22.5575H35.2462V28.4997H28.8999Z"
          fill={color}
        />
      </G>
    </Svg>
  );
}
