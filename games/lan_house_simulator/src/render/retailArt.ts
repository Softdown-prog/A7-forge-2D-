/** Stable rendering API: the three retail items are implemented in independent modules. */
export {RETAIL_DISPLAY_CAPACITY,visibleRetailStock} from "./retail/primitives.js";
export {drawVendingMachine} from "./retail/vending.js";
export {drawSnackShelf,snackShelfBagStyle,snackShelfPlacement} from "./retail/snackShelf.js";
