/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { Mesh, MeshStandardMaterial, type Group } from "three";
import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import KenneyModel from "./KenneyModel";
import Room from "./Room";
import Nightstand from "./Nightstand";
import PaperToss from "./PaperToss";
import StickyNote from "./StickyNote";
import Television from "./Television";
import { hoverCursor, Poi, usePoi } from "./Poi";
import { useRoom } from "./RoomContext";
import {
  HTML_SCALE,
  LAPTOP_SCALE,
  SCENE_SCALE,
  SCREEN_ANCHOR_POSITION,
  SCREEN_PX,
  SCREEN_TILT,
  ZOOM_DISTANCE,
} from "./constants";

interface WorkspaceProps {
  screenAnchor: RefObject<Group | null>;
}

function Pulsing({
  center,
  children,
}: {
  center: [number, number, number];
  children: ReactNode;
}) {
  const ref = useRef<Group>(null);
  const { musicOn } = useRoom();
  const invalidate = useThree((state) => state.invalidate);
  useFrame((state) => {
    const group = ref.current;
    if (!group) return;
    if (!musicOn) {
      if (group.scale.x !== 1) {
        group.scale.setScalar(1);
        invalidate();
      }
      return;
    }
    group.scale.setScalar(
      1 + 0.008 * Math.sin(state.clock.elapsedTime * Math.PI * 2 * 2.2),
    );
    invalidate();
  });
  return (
    <group position={center}>
      <group ref={ref}>
        <group position={[-center[0], -center[1], -center[2]]}>
          {children}
        </group>
      </group>
    </group>
  );
}

function DeskLamp() {
  const ref = useRef<Group>(null);
  const { lampGlow, onLampClick } = useRoom();
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    ref.current?.traverse((obj) => {
      if (!(obj instanceof Mesh)) return;
      const mat = obj.material;
      if (mat instanceof MeshStandardMaterial && mat.name === "lamp") {
        mat.emissive.set("#ffbe66");
        mat.emissiveIntensity = lampGlow * 0.4;
        // the shade must not block its own light or it throws hard wedges
        obj.castShadow = false;
      }
    });
    invalidate();
  }, [lampGlow, invalidate]);
  return (
    <group
      ref={ref}
      onClick={(e) => {
        e.stopPropagation();
        onLampClick();
      }}
      {...hoverCursor(true)}
    >
      <KenneyModel model="lampRoundTable" position={[0.2, 0.384, -0.17]} />
    </group>
  );
}

function Radio() {
  const { activePoi } = usePoi();
  const { toggleMusic } = useRoom();
  return (
    <Poi
      id="radio"
      distance={1.4}
      anchorPosition={[2.39, 0.48, 2.26]}
      anchorRotation={[0, -Math.PI / 2, 0]}
    >
      <group
        onClick={(e) => {
          if (activePoi !== "radio") return;
          e.stopPropagation();
          toggleMusic();
        }}
      >
        <Pulsing center={[2.39, 0.48, 2.26]}>
          <KenneyModel
            model="radio"
            position={[2.35, 0.384, 2.12]}
            rotation={[0, -Math.PI / 2, 0]}
            scale={0.85}
          />
        </Pulsing>
      </group>
    </Poi>
  );
}

function LaptopScreen() {
  // distanceFactor 400 cancels drei's df/400 factor: 1 CSS px = 1 world unit
  // before group scale. occlude="blending" parks the DOM behind the canvas
  // (prepend + z-index 0) and punches a depth-tested hole into the scene, so
  // furniture in front of the screen occludes it correctly.
  return (
    <Html
      transform
      occlude="blending"
      prepend
      zIndexRange={[0, 0]}
      distanceFactor={400}
    >
      <div
        className="laptop-screen"
        style={{ width: SCREEN_PX.width, height: SCREEN_PX.height }}
      >
        <iframe src="/os" title="EELE14.OS" />
      </div>
    </Html>
  );
}

function Laptop({ screenAnchor }: { screenAnchor: RefObject<Group | null> }) {
  return (
    <Poi id="laptop" distance={ZOOM_DISTANCE} anchor={screenAnchor}>
      <group position={[-0.185, 0.384, 0.02]} scale={LAPTOP_SCALE}>
        <KenneyModel model="laptop" />
        <group
          ref={screenAnchor}
          position={SCREEN_ANCHOR_POSITION}
          rotation={[SCREEN_TILT, 0, 0]}
          scale={HTML_SCALE}
        >
          <LaptopScreen />
        </group>
      </group>
    </Poi>
  );
}

export default function Workspace({ screenAnchor }: WorkspaceProps) {
  const { hour } = useRoom();
  const invalidate = useThree((state) => state.invalidate);
  const shadowsDirty = useRef(true);

  useEffect(() => {
    invalidate();
  }, [invalidate]);

  useFrame((state) => {
    if (!shadowsDirty.current) return;
    state.gl.shadowMap.needsUpdate = true;
    shadowsDirty.current = false;
  });

  return (
    <group scale={SCENE_SCALE}>
      <Room hour={hour} />

      {/* desk top surface: x -0.367..0.363, z -0.33..0.06, height 0.384 */}
      <KenneyModel model="desk" position={[-0.357, 0, 0.05]} />
      <Laptop screenAnchor={screenAnchor} />
      <DeskLamp />
      <KenneyModel model="plantSmall2" position={[0.28, 0.384, 0]} />
      <KenneyModel
        model="chairDesk"
        position={[0.32, 0, 0.6]}
        rotation={[0, Math.PI + 0.45, 0]}
      />
      <KenneyModel model="rugRounded" position={[-0.45, 0.001, 1.15]} />
      <PaperToss />

      {/* bookcase shelves sit at local y 0.13 / 0.37 / 0.61 / 0.85 */}
      <KenneyModel model="bookcaseOpen" position={[1.0, 0, -0.23]} />
      <KenneyModel model="books" position={[1.06, 0.13, -0.28]} scale={0.9} />
      <KenneyModel model="books" position={[1.19, 0.37, -0.29]} scale={0.85} />
      <KenneyModel
        model="books"
        position={[1.1, 0.61, -0.29]}
        rotation={[0, -0.1, 0]}
        scale={0.8}
      />
      <KenneyModel
        model="pottedPlant"
        position={[-1.15, 0, -0.2]}
        scale={0.8}
      />

      <KenneyModel
        model="bedSingle"
        position={[2.8, 0, 2.61]}
        rotation={[0, Math.PI, 0]}
        scale={0.8}
      />
      <KenneyModel
        model="rugRectangle"
        position={[1.95, 0.001, 3.45]}
        rotation={[0, Math.PI / 2, 0]}
        scale={0.5}
      />
      <Nightstand />
      <Radio />

      <KenneyModel
        model="bookcaseClosedWide"
        position={[-1.22, 0, 2.2]}
        rotation={[0, Math.PI / 2, 0]}
      />
      <KenneyModel model="plantSmall1" position={[-1.35, 0.79, 1.9]} />
      <KenneyModel
        model="bookcaseOpenLow"
        position={[-1.22, 0, 2.7]}
        rotation={[0, Math.PI / 2, 0]}
      />
      <KenneyModel
        model="books"
        position={[-1.3, 0.37, 2.57]}
        rotation={[0, Math.PI / 2, 0]}
        scale={0.9}
      />
      <Pulsing center={[-1.41, 0.15, 1.12]}>
        <KenneyModel
          model="speakerSmall"
          position={[-1.48, 0, 1.05]}
          rotation={[0, -Math.PI / 2, 0]}
        />
      </Pulsing>
      {/* fill the wide bookcase shelves (tops at local y 0.07/0.31/0.55) */}
      <KenneyModel
        model="books"
        position={[-1.3, 0.07, 2.0]}
        rotation={[0, Math.PI / 2, 0]}
        scale={0.9}
      />
      <KenneyModel
        model="books"
        position={[-1.3, 0.07, 1.68]}
        rotation={[0, Math.PI / 2, 0]}
        scale={0.85}
      />
      <KenneyModel
        model="books"
        position={[-1.3, 0.31, 1.85]}
        rotation={[0, Math.PI / 2, 0]}
        scale={0.9}
      />
      <KenneyModel
        model="books"
        position={[-1.3, 0.55, 2.05]}
        rotation={[0, Math.PI / 2, 0]}
        scale={0.8}
      />
      <KenneyModel
        model="cabinetTelevision"
        position={[-1.22, 0, 1.0]}
        rotation={[0, Math.PI / 2, 0]}
      />
      <Television />

      <KenneyModel
        model="doorwayFront"
        position={[0.75, 0, 3.41]}
        rotation={[0, Math.PI, 0]}
      />
      <StickyNote />
      <KenneyModel model="rugDoormat" position={[0.3, 0.001, 3.35]} />
      <KenneyModel model="coatRackStanding" position={[0.1, 0, 3.3]} />
      <KenneyModel
        model="benchCushionLow"
        position={[1.35, 0, 3.3]}
        rotation={[0, Math.PI, 0]}
      />
    </group>
  );
}
