import React from "react";
import { Composition } from "remotion";
import { Overthink } from "./Overthink";
import { StartsDefining } from "./StartsDefining";
import { Act4, ACT4_DURATION_MS } from "./Act4";
import { PrisonNeedsIron, PRISON_DURATION_FRAMES } from "./PrisonNeedsIron";

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
      <Composition
        id="Act4"
        component={Act4}
        durationInFrames={Math.round((ACT4_DURATION_MS / 1000) * 60)}
        fps={60}
        width={1080}
        height={1920}
      />
      <Composition
        id="PrisonNeedsIron"
        component={PrisonNeedsIron}
        durationInFrames={PRISON_DURATION_FRAMES}
        fps={60}
        width={1080}
        height={1920}
      />
    </>
  );
};
