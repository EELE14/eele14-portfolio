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

const ROUGHNESS: Record<string, number> = {
  glass: 0.15,
  metal: 0.42,
  metalMedium: 0.42,
  metalDark: 0.42,
  wood: 0.72,
  woodDark: 0.72,
  plant: 0.85,
  lamp: 0.9,
  carpet: 0.95,
  carpetWhite: 0.95,
  carpetDarker: 0.95,
};
const DEFAULT_ROUGHNESS = 0.8;

const CHESTNUT = "#AC8B68";
const OAK = "#c08f60";
const TERRACOTTA = "#c2694a";
const TERRACOTTA_DARK = "#a3553c";
const UPHOLSTERY = "#a85a54";
const STEEL = "#8e9aa0";

const TINTS: Partial<Record<ModelName, Record<string, string>>> = {
  desk: { wood: CHESTNUT },
  bookcaseOpen: { wood: CHESTNUT },
  sideTableDrawers: { wood: CHESTNUT },
  coatRackStanding: { wood: CHESTNUT },
  radio: { wood: CHESTNUT },
  speakerSmall: { wood: CHESTNUT },
  bookcaseClosedWide: { wood: OAK },
  bookcaseOpenLow: { wood: OAK },
  cabinetTelevision: { wood: OAK },
  rugDoormat: { wood: OAK },
  televisionVintage: { wood: OAK },
  plantSmall1: { wood: TERRACOTTA },
  plantSmall2: { wood: TERRACOTTA },
  pottedPlant: { wood: TERRACOTTA, woodDark: TERRACOTTA_DARK },
  chairDesk: { carpet: UPHOLSTERY },
  trashcan: { metal: STEEL },
};

function toLitMaterials(root: Mesh["parent"], tints?: Record<string, string>) {
  root?.traverse((obj) => {
    if (!(obj instanceof Mesh) || Array.isArray(obj.material)) return;
    obj.castShadow = true;
    obj.receiveShadow = true;

    const name = obj.material.name;
    if (obj.material instanceof MeshBasicMaterial) {
      const lit = new MeshStandardMaterial({
        color: obj.material.color,
        metalness: 0,
      });
      // DeskLamp finds its shade by material name
      lit.name = name;
      obj.material = lit;
    }
    if (!(obj.material instanceof MeshStandardMaterial)) return;

    obj.material.roughness = ROUGHNESS[name] ?? DEFAULT_ROUGHNESS;
    const tint = tints?.[name];
    if (tint) obj.material.color.set(tint);
  });
}

type KenneyModelProps = ThreeElements["group"] & { model: ModelName };

export default function KenneyModel({ model, ...props }: KenneyModelProps) {
  const { scene } = useGLTF(modelUrl(model), true, false);

  const object = useMemo(() => {
    toLitMaterials(scene, TINTS[model]);
    return scene.clone();
  }, [scene, model]);
  return (
    <group {...props}>
      <primitive object={object} />
    </group>
  );
}
