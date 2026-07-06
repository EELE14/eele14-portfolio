/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import type { ThreeElements } from "@react-three/fiber";
import { Mesh, MeshBasicMaterial, MeshStandardMaterial } from "three";

//https://kenney.nl/assets/furniture-kit
const MODEL_NAMES = [
  "laptop",
  "desk",
  "chairDesk",
  "books",
  "lampRoundTable",
  "bookcaseOpen",
  "plantSmall2",
  "pottedPlant",
  "rugRounded",
  "trashcan",
  "bedSingle",
  "doorwayFront",
  "rugDoormat",
  "bookcaseClosedWide",
  "bookcaseOpenLow",
  "sideTableDrawers",
  "radio",
  "televisionVintage",
  "cabinetTelevision",
  "coatRackStanding",
  "benchCushionLow",
  "speakerSmall",
  "rugRectangle",
  "plantSmall1",
] as const;

export type ModelName = (typeof MODEL_NAMES)[number];

const modelUrl = (name: ModelName) => `/models/${name}.glb`;

MODEL_NAMES.forEach((name) => useGLTF.preload(modelUrl(name), true, false));

function toLitMaterials(root: Mesh["parent"]) {
  root?.traverse((obj) => {
    if (!(obj instanceof Mesh)) return;
    obj.castShadow = true;
    obj.receiveShadow = true;
    if (!(obj.material instanceof MeshBasicMaterial)) return;
    const lit = new MeshStandardMaterial({
      color: obj.material.color,
      roughness: 1,
      metalness: 0,
    });
    lit.name = obj.material.name;
    obj.material = lit;
  });
}

type KenneyModelProps = ThreeElements["group"] & { model: ModelName };

export default function KenneyModel({ model, ...props }: KenneyModelProps) {
  const { scene } = useGLTF(modelUrl(model), true, false);
  useMemo(() => toLitMaterials(scene), [scene]);
  return (
    <group {...props}>
      <primitive object={scene} />
    </group>
  );
}
