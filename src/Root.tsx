import React from "react";
import { Composition } from "remotion";
import { Overthink } from "./Overthink";
import { StartsDefining } from "./StartsDefining";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Overthink"
        component={Overthink}
        durationInFrames={180}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="StartsDefining"
        component={StartsDefining}
        durationInFrames={240}
        fps={60}
        width={1080}
        height={1920}
      />
    </>
  );
};
