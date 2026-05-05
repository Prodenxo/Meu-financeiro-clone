-- Cada usuário terá sua própria cópia das categorias globais,
-- permitindo editar e excluir sem afetar outros usuários.

-- 1. Função que copia categorias globais para o novo usuário no momento do cadastro
CREATE OR REPLACE FUNCTION public.copy_global_categories_to_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.categorias_id (user_id, nome, tipo)
  SELECT NEW.id, nome, tipo
  FROM public.categorias_id
  WHERE user_id IS NULL;
  RETURN NEW;
END;
$$;

-- 2. Trigger em auth.users (remove e recria para idempotência)
DROP TRIGGER IF EXISTS on_auth_user_created_copy_categories ON auth.users;
CREATE TRIGGER on_auth_user_created_copy_categories
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.copy_global_categories_to_new_user();

-- 3. Backfill: copia categorias globais para todos os usuários existentes
--    (ignora caso o usuário já tenha uma categoria com mesmo nome+tipo)
INSERT INTO public.categorias_id (user_id, nome, tipo)
SELECT u.id, g.nome, g.tipo
FROM auth.users u
CROSS JOIN (
  SELECT nome, tipo
  FROM public.categorias_id
  WHERE user_id IS NULL
) g
WHERE NOT EXISTS (
  SELECT 1
  FROM public.categorias_id c
  WHERE c.user_id = u.id
    AND LOWER(TRIM(c.nome)) = LOWER(TRIM(g.nome))
    AND COALESCE(c.tipo, '') = COALESCE(g.tipo, '')
);

-- 4. Atualizar política RLS de SELECT: usuários veem apenas suas próprias categorias
--    (cada um agora tem cópias independentes dos globais)
DO $$
DECLARE pol TEXT;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'categorias_id' AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.categorias_id', pol);
  END LOOP;
END $$;

CREATE POLICY "categorias_select_own"
  ON public.categorias_id
  FOR SELECT
  USING (auth.uid() = user_id);
