/**
 * Chin Tuck Detector
 * ──────────────────
 * Detects: Chin tucked too far in
 *
 * Measures the horizontal distance between the nose and
 * the shoulder midpoint. If the nose is pulled too far back
 * (very small horizontal offset), the chin is over-tucked.
 *
 * This is the opposite of forward head — it can cause
 * neck strain from over-correction.
 */

import { POSTURE_TYPES } from "../types";
import { getDistance, getMidpoint } from "../../utils/geometry";

export function detectChinTuck(kp) {
  const nose = kp["nose"];
  const leftShoulder = kp["left_shoulder"];
  const rightShoulder = kp["right_shoulder"];

  if (!nose || !leftShoulder || !rightShoulder) {
    return { issue: null };
  }

  const midShoulder = getMidpoint(leftShoulder, rightShoulder);
  const shoulderWidth = getDistance(leftShoulder, rightShoulder);

  // Vertical distance from shoulders to nose (should be significant)
  const verticalDist = midShoulder.y - nose.y;
  // Horizontal offset of nose from shoulder center
  const horizontalOffset = Math.abs(nose.x - midShoulder.x);

  // If nose is almost directly above shoulders AND very close vertically,
  // chin is tucked too far. Ratio check: vertical should be > 30% of shoulder width
  if (verticalDist > 0 && verticalDist < shoulderWidth * 0.25 && horizontalOffset < shoulderWidth * 0.15) {
    return { issue: POSTURE_TYPES.CHIN_TUCK };
  }

  return { issue: null };
}
