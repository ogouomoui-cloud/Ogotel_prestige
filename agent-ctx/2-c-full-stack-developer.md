# Task 2-c — Payments API Route

## Agent: full-stack-developer

## Summary
Created the Payments API route at `/api/hotel-admin/payments` with GET (list) and POST (create) handlers.

## File Created
- `src/app/api/hotel-admin/payments/route.ts`

## Implementation Details

### GET `/api/hotel-admin/payments`
- **Auth**: `verifyHotelAccess` allowing `hotel_admin`, `manager`, `receptionist`
- **Filters**: `reservation_id`, `guest_id`, `method`, `status`, `date_from`, `date_to`
- **Joins**: Inner join with `reservations` (guest_name, room_id) and `rooms` (number)
- **Response**: `{ payments: [...], total: number }`
- **Order**: `paid_at` descending
- **Multi-tenant**: All queries filtered by `hotel_id`

### POST `/api/hotel-admin/payments`
- **Zod validation**: reservation_id (required), amount (1–50M FCFA), method (enum), status (default "payee"), reference (max 100), paid_by (max 200), notes (max 500)
- **Business logic**:
  1. Verifies reservation exists and belongs to hotel
  2. Calculates new paid_amount vs total_amount
  3. Accepts overpayments with warning (doesn't reject)
  4. Inserts payment with `paid_at = now`, `guest_id` from reservation
  5. Updates `reservation.paid_amount` incrementally
  6. Logs activity when reservation becomes fully paid (status "en_cours")
- **Activity log**: Logs `create` action for payment entity with reservation_id, amount, method
- **Response**: `{ message, payment, reservation: { paid_amount, total_amount, remaining } }` + optional `warning` for overpayment

## Patterns Followed
- `createServerClient()` → `createAdminClient()` for auth + data
- `verifyHotelAccess()` with all 3 reception roles
- `.eq("hotel_id", hotelId)` on every query
- French error messages
- Activity logging via `admin.from("activity_logs").insert(...)`

## Lint
✅ `bun run lint` passes clean
