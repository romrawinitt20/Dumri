# Order and Payment RPC Security Review — 2026-10-26

## Scope
Read-only review of order creation, customer cancellation, payment submission, merchant workflow, and rider workflow functions in the shared Supabase project used by Dumri. No live data was changed and no test orders/payments were created.

## Confirmed server-side controls
- `fn_place_order` and `fn_place_order_with_plan` require an authenticated active customer profile linked to `auth.uid()`, validate non-empty item arrays, reject unsupported card payments, check blacklisting, verify the delivery address belongs to the customer, and check that the merchant is verified/open.
- The order checkout trigger additionally checks the merchant user is active, verified, and open.
- Cash orders above 500 THB are rejected server-side. The payment-plan function restricts deposit plans to non-cash orders above 500 THB and rejects deposits for smaller orders.
- `fn_calc_subtotal` checks item ownership/availability, option IDs are valid for the specific menu item, duplicate options are rejected, and option-group minimum/maximum selection rules are enforced. This validation runs before the order lines are inserted by the reviewed order-creation functions.
- `fn_cancel_order_by_customer` scopes cancellation to the current customer's own order, limits cancellation to early states, blocks cancellation of paid orders, and marks pending payment slips rejected.
- `fn_submit_payment` scopes payment submission to the current customer's own order, checks payment method and order status, calculates full/deposit/balance amounts server-side, prevents duplicate pending/paid submissions for a payment part, requires a slip path matching the current user/order, and checks the object exists in the private payment-slips bucket.
- Key merchant and rider workflow functions require authentication and role checks. Rider availability/job functions also require active and verified status; accepting work requires online status and an unassigned ready order.
- The inspected order/payment functions are executable by authenticated users but not anon; this is expected for user-facing RPCs, provided the internal authorization checks remain intact.

## Follow-up risks and validation gaps
1. The review was static/read-only. No end-to-end tests were executed against real test accounts, and no payment slip or order was created.
2. Confirm that `payment-slips` Storage policies prevent users from reading or overwriting other users' slips, and that upload rules enforce the same user/order path constraints before the RPC is called. The RPC checks the object path when submitting, but that alone does not prove the Storage bucket policies are correct.
3. Review all table grants and RLS policies for `orders`, `order_items`, `payments`, `addresses`, `merchant_profiles`, `rider_profiles`, `options`, and `menu_items` to confirm there is no direct-write path that bypasses RPC/trigger controls.
4. Add automated regression tests for tampered item IDs, cross-menu options, another customer's address/order, suspended customer/merchant/rider, cash total over 500 THB, deposit plan at/below 500 THB, duplicate payment part, and a payment slip belonging to another user/order.
5. The separate profile-registration concern remains: `fn_register_profile` should bind the supplied phone to the verified authenticated Auth phone before creating a profile. See `docs/auth-profile-approval-review-20261026.md`.

## Decision boundary
No SQL changes or grants/policies were applied. Any production change requires exact SQL, impact assessment, verification plan, rollback plan, and explicit user approval.
