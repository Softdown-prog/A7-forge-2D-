import type {StoryId,StoryDefinition} from "./types.js";
import {definition as roofLeak} from "./definitions/roof-leak.js";
import {definition as neighborNoise} from "./definitions/neighbor-noise.js";
import {definition as damagedKeyboard} from "./definitions/damaged-keyboard.js";
import {definition as malwareIncident} from "./definitions/malware-incident.js";
import {definition as missingStock} from "./definitions/missing-stock.js";
import {definition as unexpectedPowerBill} from "./definitions/unexpected-power-bill.js";
import {definition as lateSupplier} from "./definitions/late-supplier.js";
import {definition as lostDocument} from "./definitions/lost-document.js";
import {definition as localNetwork} from "./definitions/local-network.js";
import {definition as neighborhoodPaper} from "./definitions/neighborhood-paper.js";
import {definition as privacyExposure} from "./definitions/privacy-exposure.js";
import {definition as schoolUniformPolicy} from "./definitions/school-uniform-policy.js";
import {definition as gpuGames2005} from "./definitions/gpu-games-2005.js";
import {definition as communityDrive} from "./definitions/community-drive.js";

/** Stable ID order retained for deterministic story scheduling and saved games. */
export const STORIES:Record<StoryId,StoryDefinition>={
 "roof-leak":roofLeak,
 "neighbor-noise":neighborNoise,
 "damaged-keyboard":damagedKeyboard,
 "malware-incident":malwareIncident,
 "missing-stock":missingStock,
 "unexpected-power-bill":unexpectedPowerBill,
 "late-supplier":lateSupplier,
 "lost-document":lostDocument,
 "local-network":localNetwork,
 "neighborhood-paper":neighborhoodPaper,
 "privacy-exposure":privacyExposure,
 "school-uniform-policy":schoolUniformPolicy,
 "gpu-games-2005":gpuGames2005,
 "community-drive":communityDrive,
};
