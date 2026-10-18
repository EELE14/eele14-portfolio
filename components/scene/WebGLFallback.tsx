/* Copyright (c) 2026 eele14. All Rights Reserved. */

export default function WebGLFallback() {
  return (
    <div className="scene-fallback">
      <div className="scene-fallback-card">
        <h1>3D is unavailable in this browser</h1>
        <p>
          The room needs WebGL 2, which is switched off or unsupported here.
          Turning on hardware acceleration in your browser settings usually
          fixes it.
        </p>
        <a href="/os" className="scene-fallback-link">
          Open the desktop
        </a>
      </div>
    </div>
  );
}
