/* Copyright (c) 2026 eele14. All Rights Reserved. */

export const WHEEL_BRIDGE_TYPE = "eele14:wheel";

export interface WheelBridgeMessage {
  type: typeof WHEEL_BRIDGE_TYPE;
  deltaX: number;
  deltaY: number;
}

export function isWheelBridgeMessage(
  data: unknown,
): data is WheelBridgeMessage {
  if (typeof data !== "object" || data === null) return false;
  const msg = data as Partial<WheelBridgeMessage>;
  return (
    msg.type === WHEEL_BRIDGE_TYPE &&
    typeof msg.deltaX === "number" &&
    typeof msg.deltaY === "number"
  );
}
