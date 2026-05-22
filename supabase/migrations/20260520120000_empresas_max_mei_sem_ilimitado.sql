-- Corrige legado: max_mei NULL vira número (≥ MEI em uso / Stripe / PIX).
-- 0 = sem MEI; ≥ 1 = módulo ativo com essa quantidade de vagas.

WITH mei_em_uso AS (
  SELECT
    r.empresas_id AS empresa_id,
    COUNT(*)::integer AS qtd
  FROM public.role_x_user_x_empresa r
  WHERE r.status = true
    AND r.empresas_id IS NOT NULL
    AND (r.mei IS NULL OR r.mei = true)
  GROUP BY r.empresas_id
),
stripe_mei AS (
  SELECT
    l.empresa_id,
    COALESCE(SUM(l.mei_slots), 0)::integer AS slots
  FROM public.empresa_mei_subscription_lines l
  WHERE l.status = 'active'
  GROUP BY l.empresa_id
),
alvo AS (
  SELECT
    e.id,
    GREATEST(
      COALESCE(u.qtd, 0),
      COALESCE(s.slots, 0),
      COALESCE(e.legacy_mei_slots_pix, 0),
      CASE WHEN COALESCE(u.qtd, 0) > 0 THEN 1 ELSE 0 END
    ) AS novo_max
  FROM public.empresas e
  LEFT JOIN mei_em_uso u ON u.empresa_id = e.id
  LEFT JOIN stripe_mei s ON s.empresa_id = e.id
  WHERE e.max_mei IS NULL
)
UPDATE public.empresas e
SET max_mei = a.novo_max
FROM alvo a
WHERE e.id = a.id;
