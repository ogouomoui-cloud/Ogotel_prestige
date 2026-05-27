---
Task ID: 2-b
Agent: full-stack-developer
Task: Create Reservation management API routes (list, create, detail, update, check-in, check-out)

Work Log:
- Created /api/hotel-admin/reservations — GET (list with search/filters/status_counts) + POST (create with auto-calc nights, amount, deposit 30%)
- Created /api/hotel-admin/reservations/[id] — GET (detail with room+guest joins + payments) + PUT (update with room reassignment, cancellation, date recalc)
- Created /api/hotel-admin/reservations/[id]/checkin — PATCH (check-in: reservation→en_cours, room→occupee)
- Created /api/hotel-admin/reservations/[id]/checkout — PATCH (check-out: reservation→terminee, room→nettoyage)
- Auto-calculates: number_of_nights, total_amount, deposit_required (30%)
- Room status auto-updates on create (→reservee), check-in (→occupee), checkout (→nettoyage), cancellation (→disponible)
- Room reassignment handles old room release + new room reservation
- verifyHotelAccess allows hotel_admin, manager, receptionist
- Multi-tenant isolation via hotel_id on every query
- Zod validation on POST and PUT endpoints
- Activity logging for all mutations (create, update, check-in, check-out)
- Lint passes clean

Stage Summary:
- 4 API route files created
- Complete reservation lifecycle: create → confirm → check-in → check-out → archive
- Room status automatically synced with reservation status
- Search by guest name, room number, guest full name
- Filter by status, room_type, date range
