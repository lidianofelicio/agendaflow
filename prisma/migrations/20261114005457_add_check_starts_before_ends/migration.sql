-- Garante que a data/hora de início seja estritamente anterior ao término
ALTER TABLE "appointments"
ADD CONSTRAINT "appointments_starts_before_ends_check"
CHECK ("startsAt" < "endsAt");