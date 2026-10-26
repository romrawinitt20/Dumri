# Dumri Daily Closing and Payout Workflow

Status: owner-approved product requirements; implementation starts in the demo UI only.
Timezone: Asia/Bangkok (UTC+07:00).

## Owner decisions
- Daily Closing cutoff: 02:00 every day, Thailand time.
- Manual payout operating window: 10:00–12:00 every day, Thailand time.
- Temporary settlement account: owner's personal bank account (temporary, subject to bank/legal/accounting review before real customer funds are accepted).
- Only Super Admin may approve and record merchant/rider payouts.
- A payout must have a bank transaction reference or transfer-slip evidence before the operator can mark it paid.
- Marking a payout paid records an actual transfer that has already occurred; it does not initiate a bank transfer.
- On successful recording, send an email to the recipient and keep an audit trail.
- Do not send a success email if the transfer failed.
- Do not change or delete Midnight Meals objects. Do not merge the PR without owner approval.

## Daily window semantics
A business day runs from 02:00 inclusive on the local date through immediately before 02:00 on the next local date. At 02:00, close the prior business window and calculate a snapshot. Keep orders that are incomplete, cancelled, disputed, refunded, or otherwise ineligible out of payable totals according to explicit order/payment rules. Do not assume order status alone proves the funds were collected.

The close job must be idempotent: re-running for the same business date must not create a second settlement batch or duplicate a payout. Store the timezone explicitly and test daylight/time conversions even though Thailand currently does not observe daylight saving.

## Payout operator window
- 02:00: create/refresh a draft closing summary for the window that just ended.
- 08:00–10:00: review eligible orders, payment reconciliation, refunds/disputes, payout bank details and totals.
- 10:00–12:00: Super Admin performs bank transfers through the bank's permitted channel and records each result.
- After 12:00, unpaid or failed items remain pending with a reason; never silently mark them paid.

## Required payout states
- `pending_review`: closing summary needs review.
- `approved`: reviewed and approved by an authorized Super Admin.
- `ready_to_pay`: approved amount is ready for manual transfer.
- `paid`: transfer has actually been made and evidence/reference is present.
- `transfer_failed`: bank transfer failed; preserve the record and reason.
- `held`: dispute, refund, missing bank details, or another documented hold.

The demo currently uses simplified labels. Production state transitions must be enforced server-side with role checks and an immutable audit log.

## Evidence and email requirements
Before changing an item to `paid`, require at least one of:
1. a transaction reference recorded from the bank; or
2. a slip file uploaded to a private Storage bucket with restricted access.

The production upload must verify MIME type/size, use a private bucket, and store a protected object path rather than a public URL. A filename selected in the browser is not evidence of an upload. Store operator Auth UID, timestamp, amount, recipient, business date, reference, evidence object key, and email delivery status.

Send a recipient-specific email only after the paid transition commits. Use an outbox/retry mechanism so a temporary email provider failure can be retried without paying the recipient twice. Email failure must not roll back the already-completed bank transfer; it must show `email_pending`/failed status for retry. Never include full bank account numbers or sensitive personal documents in the email.

## Security / accounting constraints
- Never trust a frontend role label. Check Super Admin authorization inside the server-side RPC or Edge Function on every privileged action.
- Never expose bank account details to other merchants, riders, customers, or general authenticated users.
- Use an append-only audit log and idempotency key per payout/transfer reference.
- Do not allow direct client updates to payout amount, recipient, status, or audit columns.
- Reconcile totals to collected funds; separate merchant payable, rider payable, platform GP, tax reserve, refunds, cash-on-delivery settlement, and adjustments.
- The known business rule says GP is 7% of each merchant's daily sales. Before production calculation, reconcile this against existing `orders.gp_percent`, `orders.gp_amount`, `merchant_invoices`, and current RPCs; do not blindly repurpose `fn_platform_fee`.
- For cash orders, respect the owner's rule that the rider wallet debt to Dumri is the GP amount only, not the full food order value.
- Personal-account use is a temporary owner choice, not a determination that the arrangement is legally permitted. Verify bank terms, payment-service requirements, tax/accounting treatment, and recipient payout handling before real-money launch.

## Implementation status
- Demo screen: planned/implemented in the current branch; memory-only fake data.
- Live settlement schema/RPCs: not changed.
- Real bank transfer integration: not implemented.
- Real email provider: not configured/implemented here.
- Production scheduling at 02:00 Asia/Bangkok: not enabled.
- Production PR: remains unmerged pending owner approval and testing.
