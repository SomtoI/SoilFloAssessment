# Engineering Observations

Things noticed during implementation that were intentionally left out of scope — either because the brief didn't specify them, because the right solution requires operational data, or because the ambiguity itself is the observation.

---

**Minimum gap between dispatch times**

The spec prevents two tickets with the same dispatch time for the same truck. What it doesn't address is that two tickets one second apart are equally impossible. A service-layer guard with a configurable minimum gap (e.g. 15 minutes) between tickets for the same truck would enforce this. The threshold wasn't hardcoded because the right value depends on operational data.

---

**Daily dispatch cap per truck**

The bulk endpoint caps a single request at 50 tickets, but a client can send multiple batches and accumulate more across calls. If there is a confirmed maximum dispatches per truck per day (driven by the dispatch cycle constraint above), this should be enforced at write time: count existing tickets for that truck on the same date, reject if `existing + incoming > cap`. Without a confirmed figure, implementing a cap risks rejecting legitimate data.

This becomes significantly more complex when a single batch spans multiple calendar dates. A simple "count today's tickets" check breaks entirely. There would be added complexity to the checks needed, one approach being to group the incoming batch by date, check each date's existing count independently inside the transaction, and only proceed if every date passes. Of course there are cascading effects of this and other changes that would be made. I would have to sit with this and think of a good solution in this situation, but for this exercise, it is unnecessary.

---

**Work hours enforcement**

Dispatch times are validated against the future but not against site operating hours. A ticket submitted for a 2am dispatch is technically valid under the current rules. Construction sites operate within regulated hours, and that may vary to, so the right implementation is a configurable hours window per site, not a hardcoded global value. This would require a `siteHours` configuration that would need to be provided.

---

**Idempotency on bulk create**

The bulk create endpoint is not idempotent. This matters because networks are unreliable: if a client sends a request, the server processes it successfully, but the response never arrives (network drop, timeout), the client has no way to know whether the tickets were created. A retry with different timestamps creates a duplicate set; a retry with the same timestamps is rejected by the duplicate-time guard — either way, the client is stuck.

The standard solution is an `Idempotency-Key` header. Implementing this requires a cache (Redis) or a database table with an expiry policy, which is out of scope for this exercise.

---

**Rate limiting**

No per-client throttle exists on the bulk create endpoint. A single client could hammer the endpoint repeatedly. `@nestjs/throttler` would address this with minimal configuration.

---

**Authentication**

All endpoints are open. In production, a JWT guard on every route — clients exchange credentials for a signed token and include it on every request.

---

**Ticket number ordering vs actual dispatch chronology**

Ticket numbers are assigned at data entry time, not at the time of physical dispatch. A dispatcher entering paper records for Jan 15 on Jan 17 will receive ticket numbers higher than records entered live on Jan 16 — even though those dispatches happened earlier. In a physical paper ticket book, the number is torn off before the truck leaves, so the sequence genuinely reflects chronological order. The spec defines ticket numbers as incrementing per site but does not specify what they should be ordered by, making this an open ambiguity with real audit implications.

---

**Future date tolerance is an interpretation**

The spec states "tickets cannot be dispatched at a future date." The implementation rejects timestamps more than 60 seconds ahead of the server clock, not strictly any future timestamp, to account for client clock drift. The 60-second buffer is a judgment call — the spec gives no guidance on tolerance. A stricter reading would allow zero buffer.

---

**Historical dispatch cutoff is undefined**

The spec prevents future dispatch times but says nothing about how far in the past a dispatcher can log. The current implementation allows any past timestamp. Whether a business constraint exists (e.g. no entries older than 30 days) is not addressed in the brief.

---

**Supporting lookup endpoints beyond the spec**

`GET /sites/:id` and `GET /trucks/:id` are not in the brief. TI chose to add them because the bulk create endpoint requires a valid `truckId`, and it aids with exploring the exercise. These endpoints make the API self-contained for anyone testing it cold.

---

**Material type enforcement**

The `material` field is currently a TypeScript enum (`Soil`) validated at the application layer. SQLite has no native enum type, so the value is stored as a plain string in the database, meaning nothing at the database level prevents an invalid value from being written directly. In production with PostgreSQL, I would either useDB-level enums defined in the schema or a 'materials' lookup table, depending on business needs.
