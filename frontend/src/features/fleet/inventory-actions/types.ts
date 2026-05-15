export interface OpeningSnapshotLine {
  product_id: number
  product_name: string
  opening_qty: number
}

export interface OpeningSnapshotPayload {
  saved_at: string
  car_id: number
  trip_id: number | null
  lines: OpeningSnapshotLine[]
}

/** Direction for POST `/inventory/adjustment` line items (per-row). */
export type InventoryAdjustmentMode = 'increase' | 'decrease'

export interface InventoryFormLine {
  rowId: string
  productId: number | null
  /** Set when user picks a product (used for local opening snapshot labels). */
  productLabel?: string
  quantity: string
  /** Used only by the adjustment line editor variant. */
  adjustmentMode?: InventoryAdjustmentMode
}

export interface ClosingCountLineState {
  product_id: number
  product_name: string
  /** From saved opening count (0 if product only appeared via loads) */
  opening_qty: number
  /** Cumulative qty from posted loads for this vehicle/trip */
  loaded_qty: number
  closing_qty: string
}
