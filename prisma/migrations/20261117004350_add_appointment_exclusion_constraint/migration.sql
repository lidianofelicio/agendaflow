-- Habilita extensão necessária para combinar igualdade (=) com sobreposição de intervalos (&&) no índice GiST
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Impede sobreposição de horários para o mesmo recurso quando status = 'ACTIVE'
ALTER TABLE "appointments"
ADD CONSTRAINT "appointments_no_overlapping_active"
EXCLUDE USING gist (
  "resourceId" WITH =,
  tsrange("startsAt", "endsAt", '[)') WITH &&
)
WHERE ("status" = 'ACTIVE');