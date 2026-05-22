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

const normalizeText = (value) => {
  if (value == null) return null;
  const s = String(value).trim();
  return s || null;
};

const requireInternalSecret = (req, _res, next) => {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) return next(unauthorized());
  const token = normalizeEnvSecret(authHeader.replace(/^Bearer\s+/i, '').trim());
  const secret = normalizeEnvSecret(process.env.ACCESS_REQUEST_INTERNAL_SECRET || '');
  if (!secret || token !== secret) return next(unauthorized());
  return next();
};

// Verifica se o actorUserId é superadmin via role_x_user_x_empresa
const getActorRole = async (actorUserId) => {
  const sb = getServiceRoleClient();

  const { data: linkData } = await sb
    .from('role_x_user_x_empresa')
    .select('roles_id, status')
    .eq('user_id', actorUserId)
    .eq('status', true)
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

// POST /api/internal/access-requests/manage
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

    // LIST: busca usuários com role_x_user_x_empresa.status = false E empresa pendente
    if (action === 'list') {
      const { data: pendingLinks, error: linksErr } = await sb
        .from('role_x_user_x_empresa')
        .select('user_id, created_at')
        .eq('status', false);

      if (linksErr) return next(linksErr);
      if (!pendingLinks?.length) return res.json({ requests: [] });

      const requests = (
        await Promise.all(
          pendingLinks.map(async (link) => {
            const { data: authData } = await sb.auth.admin.getUserById(link.user_id);
            const meta = authData?.user?.user_metadata ?? {};

            const { data: empresa } = await sb
              .from('empresas')
              .select(
                'empresa, cnpj, razao_social, nome_fantasia, logradouro, numero, complemento, bairro, cidade, estado, cep, telefone, email',
              )
              .eq('requested_by', link.user_id)
              .eq('status', 'pending')
              .maybeSingle();

            // Só retorna usuários que têm empresa pendente (filtra bloqueados)
            if (!empresa) return null;

            const enderecoParts = [
              empresa.logradouro,
              empresa.numero,
              empresa.complemento,
              empresa.bairro,
              empresa.cidade,
              empresa.estado,
            ].filter(Boolean);

            return {
              userId: link.user_id,
              email: authData?.user?.email ?? null,
              fullName: meta.full_name ?? meta.name ?? null,
              phone: meta.phone ?? authData?.user?.phone ?? null,
              observacao: meta.access_request_observacao ?? meta.observacao ?? null,
              requestedAt: link.created_at ?? null,
              empresa: {
                nome: empresa.empresa ?? null,
                cnpj: empresa.cnpj ?? null,
                razaoSocial: empresa.razao_social ?? null,
                nomeFantasia: empresa.nome_fantasia ?? null,
                endereco: enderecoParts.join(', '),
                cep: empresa.cep ?? null,
                telefone: empresa.telefone ?? null,
                email: empresa.email ?? null,
              },
            };
          }),
        )
      ).filter(Boolean);

      return res.json({ requests });
    }

    // APPROVE: ativa o vínculo e a empresa
    if (action === 'approve') {
      if (!userId) return next(badRequest('userId obrigatório para approve'));

      await sb
        .from('role_x_user_x_empresa')
        .update({ status: true, roles_id: ADMIN_ROLE_ID, mei: false })
        .eq('user_id', userId)
        .eq('status', false);

      await sb
        .from('empresas')
        .update({ status: 'active' })
        .eq('requested_by', userId)
        .eq('status', 'pending');

      return res.json({ ok: true });
    }

    // REJECT: remove o vínculo pendente, a empresa e o usuário
    if (action === 'reject') {
      if (!userId) return next(badRequest('userId obrigatório para reject'));

      await sb
        .from('role_x_user_x_empresa')
        .delete()
        .eq('user_id', userId)
        .eq('status', false);

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

// POST /api/internal/access-requests/submit
router.post('/submit', requireInternalSecret, async (req, res, next) => {
  try {
    const body = req.body ?? {};
    const user = body.user ?? {};
    const empresaInput = body.empresa ?? {};
    const observacao = normalizeText(body.observacao);

    const email = normalizeText(user.email)?.toLowerCase();
    const password = String(user.password || '').trim();
    const fullName = normalizeText(user.fullName);
    const phone = normalizeText(user.phone);

    if (!email) return next(badRequest('E-mail é obrigatório.'));
    if (!fullName) return next(badRequest('Nome completo é obrigatório.'));
    if (password.length < 8) return next(badRequest('Senha deve ter pelo menos 8 caracteres.'));

    const cnpj = String(empresaInput.cnpj || '').replace(/\D/g, '');
    if (cnpj.length !== 14) return next(badRequest('CNPJ inválido (14 dígitos).'));

    const razaoSocial = normalizeText(empresaInput.razaoSocial);
    const nomeFantasia = normalizeText(empresaInput.nomeFantasia);
    const empresaNome = razaoSocial || nomeFantasia;
    if (!empresaNome) return next(badRequest('Informe razão social ou nome fantasia.'));

    const sb = getServiceRoleClient();

    // Verifica e-mail duplicado
    const { data: listData, error: listErr } = await sb.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (listErr) return next(listErr);
    const emailTaken = (listData?.users || []).some(
      (u) => String(u.email || '').toLowerCase() === email,
    );
    if (emailTaken) return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });

    // Cria empresa com status pending
    const { data: empresaRow, error: empresaErr } = await sb
      .from('empresas')
      .insert({
        empresa: empresaNome,
        cnpj,
        razao_social: razaoSocial,
        nome_fantasia: nomeFantasia,
        cep: String(empresaInput.cep || '').replace(/\D/g, '') || null,
        logradouro: normalizeText(empresaInput.logradouro),
        numero: normalizeText(empresaInput.numero),
        complemento: normalizeText(empresaInput.complemento),
        bairro: normalizeText(empresaInput.bairro),
        cidade: normalizeText(empresaInput.cidade),
        estado: normalizeText(empresaInput.estado)?.toUpperCase()?.slice(0, 2) || null,
        telefone: normalizeText(empresaInput.telefone),
        email: normalizeText(empresaInput.email),
        max_mei: 1,
        status: 'pending',
      })
      .select('id')
      .maybeSingle();

    if (empresaErr || !empresaRow?.id) {
      return next(empresaErr ?? new Error('Erro ao criar empresa.'));
    }

    // Cria usuário no auth
    const { data: createdUser, error: createErr } = await sb.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        display_name: fullName,
        phone: phone || null,
        access_request_observacao: observacao,
        access_requested_at: new Date().toISOString(),
      },
    });

    if (createErr || !createdUser?.user?.id) {
      await sb.from('empresas').delete().eq('id', empresaRow.id);
      return next(createErr ?? new Error('Erro ao criar usuário.'));
    }

    const userId = createdUser.user.id;

    try {
      // Vincula empresa ao usuário criador
      await sb.from('empresas').update({ requested_by: userId }).eq('id', empresaRow.id);

      // Cria perfil (sem status — o status vem do role_x_user_x_empresa)
      await sb.from('profiles').upsert({ id: userId, role: 'usuario' });

      // Busca roles_id para "User/usuario"
      const { data: rows } = await sb.from('roles').select('id, roles');
      const userRole = (rows || []).find((r) => {
        const n = String(r.roles || '').trim().toLowerCase();
        return n === 'user' || n === 'usuario';
      });
      if (!userRole?.id) throw new Error('Perfil de usuário não encontrado na base.');

      // Cria vínculo com status=false (pendente de aprovação)
      const { error: linkErr } = await sb.from('role_x_user_x_empresa').insert({
        user_id: userId,
        roles_id: userRole.id,
        empresas_id: empresaRow.id,
        status: false,
        mei: true,
      });
      if (linkErr) throw new Error(linkErr.message);

      if (phone) {
        const cleaned = phone.startsWith('+') ? phone.slice(1) : phone.replace(/\D/g, '');
        if (cleaned) {
          await sb
            .from('n8n_link')
            .upsert({ user_id: userId, user_number: cleaned }, { onConflict: 'user_id' });
        }
      }
    } catch (err) {
      // Rollback: remove tudo criado
      await sb.from('role_x_user_x_empresa').delete().eq('user_id', userId).catch(() => {});
      await sb.from('profiles').delete().eq('id', userId).catch(() => {});
      await sb.from('empresas').delete().eq('id', empresaRow.id).catch(() => {});
      await sb.auth.admin.deleteUser(userId).catch(() => {});
      return next(err);
    }

    return res.json({ ok: true, userId });
  } catch (err) {
    return next(err);
  }
});

export default router;
