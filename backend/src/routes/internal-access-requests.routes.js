import { Router } from 'express';
import { getServiceRoleClient } from '../config/supabase.js';
import { badRequest, unauthorized } from '../utils/errors.js';
import { normalizeEnvSecret } from '../config/env.js';

const router = Router();

const ADMIN_ROLE_ID = '849af65c-fe71-464c-8d26-1c61166b29a1';

const normalizeRole = (role) => {
  if (!role) return null;
  const n = String(role).trim().toLowerCase();
  if (n === 'superadmin') return 'superadmin';
  if (n === 'admin') return 'admin';
  if (n === 'user' || n === 'usuario') return 'usuario';
  if (n === 'outsider') return 'outsider';
  return null;
};

const requireInternalSecret = (req, _res, next) => {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) return next(unauthorized());
  const token = normalizeEnvSecret(authHeader.replace(/^Bearer\s+/i, '').trim());
  const secret = normalizeEnvSecret(process.env.ACCESS_REQUEST_INTERNAL_SECRET || '');
  if (!secret || token !== secret) return next(unauthorized());
  return next();
};

const getActorRole = async (actorUserId) => {
  const sb = getServiceRoleClient();

  const { data: linkData } = await sb
    .from('role_x_user_x_empresa')
    .select('roles_id')
    .eq('user_id', actorUserId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (linkData?.roles_id) {
    const { data: roleData } = await sb
      .from('roles')
      .select('roles')
      .eq('id', linkData.roles_id)
      .maybeSingle();
    return normalizeRole(roleData?.roles);
  }

  const { data: profile } = await sb
    .from('profiles')
    .select('role')
    .eq('id', actorUserId)
    .maybeSingle();
  return normalizeRole(profile?.role);
};

router.post('/manage', requireInternalSecret, async (req, res, next) => {
  try {
    const { action, actorUserId, userId } = req.body ?? {};

    if (!actorUserId) return next(badRequest('actorUserId obrigatório'));
    if (!action) return next(badRequest('action obrigatória'));

    const role = await getActorRole(actorUserId);
    if (role !== 'superadmin') {
      return res.status(403).json({ error: 'Apenas superadmin.' });
    }

    const sb = getServiceRoleClient();

    if (action === 'list') {
      const { data: pendingProfiles, error: profilesErr } = await sb
        .from('profiles')
        .select('id, created_at')
        .eq('status', 'pending');

      if (profilesErr) return next(profilesErr);
      if (!pendingProfiles?.length) return res.json({ requests: [] });

      const requests = await Promise.all(
        pendingProfiles.map(async (profile) => {
          const { data: authData } = await sb.auth.admin.getUserById(profile.id);
          const meta = authData?.user?.user_metadata ?? {};

          const { data: empresa } = await sb
            .from('empresas')
            .select(
              'empresa, cnpj, razao_social, nome_fantasia, logradouro, numero, complemento, bairro, cidade, estado, cep, telefone, email',
            )
            .eq('requested_by', profile.id)
            .eq('status', 'pending')
            .maybeSingle();

          const enderecoParts = [
            empresa?.logradouro,
            empresa?.numero,
            empresa?.complemento,
            empresa?.bairro,
            empresa?.cidade,
            empresa?.estado,
          ].filter(Boolean);

          return {
            userId: profile.id,
            email: authData?.user?.email ?? null,
            fullName: meta.full_name ?? meta.name ?? null,
            phone: meta.phone ?? authData?.user?.phone ?? null,
            observacao: meta.observacao ?? null,
            requestedAt: profile.created_at ?? null,
            empresa: empresa
              ? {
                  nome: empresa.empresa ?? null,
                  cnpj: empresa.cnpj ?? null,
                  razaoSocial: empresa.razao_social ?? null,
                  nomeFantasia: empresa.nome_fantasia ?? null,
                  endereco: enderecoParts.join(', '),
                  cep: empresa.cep ?? null,
                  telefone: empresa.telefone ?? null,
                  email: empresa.email ?? null,
                }
              : null,
          };
        }),
      );

      return res.json({ requests });
    }

    if (action === 'approve') {
      if (!userId) return next(badRequest('userId obrigatório para approve'));

      const { data: empresa } = await sb
        .from('empresas')
        .select('id')
        .eq('requested_by', userId)
        .eq('status', 'pending')
        .maybeSingle();

      await sb.from('profiles').update({ status: 'active' }).eq('id', userId);

      if (empresa?.id) {
        await sb.from('empresas').update({ status: 'active' }).eq('id', empresa.id);
        await sb.from('role_x_user_x_empresa').insert({
          user_id: userId,
          empresas_id: empresa.id,
          roles_id: ADMIN_ROLE_ID,
          status: true,
          mei: false,
        });
      }

      return res.json({ ok: true });
    }

    if (action === 'reject') {
      if (!userId) return next(badRequest('userId obrigatório para reject'));

      await sb
        .from('empresas')
        .delete()
        .eq('requested_by', userId)
        .eq('status', 'pending');

      await sb.auth.admin.deleteUser(userId);

      return res.json({ ok: true });
    }

    return next(badRequest(`Ação desconhecida: ${action}`));
  } catch (err) {
    return next(err);
  }
});

export default router;
