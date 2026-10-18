# Generated circulation snapshots

These are deterministic simulator test states, not player saves or account data.

- `exit-near-bin.json`: historical seed 13, minute 417, hourly price 0.50 and test inventory of 60 units per product. Customer 22 is already `leaving` at (5.774, 4.813), beside the front bin. Waiting shoppers form a continuous barrier across the aisle. In the previous engine the departure takes another 70 minutes; the regression requires it to finish within 32, without closing the business or moving actors artificially.
- `shopping-crossing.json`: historical seed 44, minute 533, default price/inventory. A visitor crossing toward the counter blocks the first snack buyer. The coarse navigation grid misses a real gap; four shoppers remain stationary until the closing routine changes their destinations. The regression requires all four to complete their purchases and leave before closing.

The factories discard transient presentation effects. Tests advance the actual simulation and retain its arrivals, RNG, accounts and collisions.
