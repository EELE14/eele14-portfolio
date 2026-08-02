/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { ShaderChunk } from "three";

const PLACEHOLDER = "vec3 CustomToneMapping( vec3 color ) { return color; }";

const FULL_ACES = 0.04;
const FULL_NEUTRAL = 0.3;

const BLENDED = `
vec3 CustomToneMapping( vec3 color ) {

	float luminance = dot( color * toneMappingExposure, vec3( 0.2126, 0.7152, 0.0722 ) );
	float t = smoothstep( ${FULL_ACES}, ${FULL_NEUTRAL}, luminance );

	return mix( ACESFilmicToneMapping( color ), NeutralToneMapping( color ), t );

}`;

export function installBlendedToneMapping() {
  if (!ShaderChunk.tonemapping_pars_fragment.includes(PLACEHOLDER)) return;
  ShaderChunk.tonemapping_pars_fragment =
    ShaderChunk.tonemapping_pars_fragment.replace(PLACEHOLDER, BLENDED);
}
