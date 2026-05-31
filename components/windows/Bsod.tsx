/* Copyright (c) 2026 eele14. All Rights Reserved. */

interface BsodProps {
  stopCode?: string;
  detail?: string;
}

export default function Bsod({
  stopCode = "PORTFOLIO_PAGE_NOT_FOUND",
  detail,
}: BsodProps) {
  return (
    <div
      style={{
        background: "#0000aa",
        color: "white",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Courier New', monospace",
        fontSize: "16px",
        padding: "48px",
      }}
    >
      <pre
        style={{ maxWidth: "640px", lineHeight: 1.6, whiteSpace: "pre-wrap" }}
        aria-label="Windows Blue Screen of Death"
      >
        {`A problem has been detected and Windows has been shut down to prevent damage
to your computer.

${stopCode}
${detail ? `\n${detail}\n` : ""}
If this is the first time you've seen this stop error screen,
restart your computer. If this screen appears again, follow
these steps:

Check to make sure any new hardware or software is properly installed.
If this is a new installation, ask your hardware or software manufacturer
for any Windows updates you might need.

If problems continue, disable or remove any newly installed hardware
or software. Disable BIOS memory options such as caching or shadowing.
If you need to use Safe Mode to remove or disable components, restart
your computer, press F8 to select Advanced Startup Options, and then
select Safe Mode.

Technical information:

*** STOP: 0x000000C4 (0x00000000, 0x00000000, 0x00000000, 0x00000000)

Beginning dump of physical memory...
Physical memory dump complete.

Contact your system administrator or technical support group for further
assistance.`}
      </pre>
    </div>
  );
}
