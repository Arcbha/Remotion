import React from "react";
import { Composition } from "remotion";
import { Overthink } from "./Overthink";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Overthink"
      component={Overthink}
      durationInFrames={180}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
