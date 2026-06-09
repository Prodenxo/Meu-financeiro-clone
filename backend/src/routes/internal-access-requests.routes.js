import { Router } from 'express';
import { getServiceRoleClient } from '../config/supabase.js';
import { badRequest, unauthorized } from '../utils/errors.js';
import { normalizeEnvSecret } from '../config/env.js';
import { buildAccessRequestReport } from '../services/access-request-report.service.js';
import {
  approveAccessRequest,
  getUserRole,
  listPendingAccessRequests,
  rejectAccessRequest,
} from '../services/access-request-manage.service.js';
import { notifySuperadminAccessRequestSubmitted } from '../services/access-request-whatsapp.service.js';
import { canonicalizeBrazilWhatsappPhone } from '../utils/whatsapp-phone.js';

const router = Router();

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

// POST /api/internal/access-requests/manage
router.post('/manage', requireInternalSecret, async (req, res, next) => {
  try {
    const { action, actorUserId, userId } = req.body ?? {};

    if (!actorUserId) return next(badRequest('actorUserId obrigatório'));
    if (!action) return next(badRequest('action obrigatória'));

    const sb = getServiceRoleClient();
    const role = await getUserRole(sb, actorUserId);
    if (role !== 'superadmin') {
      return res.status(403).json({ error: 'Apenas superadmin.' });
    }

    // LIST: busca usuários com role_x_user_x_empresa.status = false E empresa pendente
    if (action === 'list') {
      const pending = await listPendingAccessRequests(sb);
      const requests = await Promise.all(
        pending.map(async (item) => {
          const { data: empresa } = await sb
            .from('empresas')
            .select(
              'empresa, cnpj, razao_social, nome_fantasia, logradouro, numero, complemento, bairro, cidade, estado, cep, telefone, email',
            )
            .eq('requested_by', item.userId)
            .eq('status', 'pending')
            .maybeSingle();

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
            userId: item.userId,
            email: item.email,
            fullName: item.fullName,
            phone: item.phone,
            observacao: item.observacao,
            requestedAt: item.requestedAt,
            empresa: {
              nome: empresa.empresa ?? item.empresa?.nome ?? null,
              cnpj: empresa.cnpj ?? item.empresa?.cnpj ?? null,
              razaoSocial: empresa.razao_social ?? item.empresa?.razaoSocial ?? null,
              nomeFantasia: empresa.nome_fantasia ?? item.empresa?.nomeFantasia ?? null,
              endereco: enderecoParts.join(', '),
              cep: empresa.cep ?? null,
              telefone: empresa.telefone ?? null,
              email: empresa.email ?? null,
            },
          };
        }),
      );

      return res.json({ requests: requests.filter(Boolean) });
    }

    // REPORT: histórico derivado de empresas + auth metadata (sem tabela de auditoria)
    if (action === 'report') {
      const limit = Math.min(Math.max(Number(req.body?.limit) || 200, 1), 500);
      const eventType = normalizeText(req.body?.eventType);

      let { entries } = await buildAccessRequestReport(limit);
      if (eventType && ['submitted', 'approved'].includes(eventType)) {
        entries = entries.filter((e) => e.eventType === eventType);
      }

      return res.json({ entries });
    }

    // APPROVE: ativa o vínculo e a empresa
    if (action === 'approve') {
      if (!userId) return next(badRequest('userId obrigatório para approve'));

      const result = await approveAccessRequest({ actorUserId, userId });
      if (!result.ok) {
        return res.status(404).json({ error: 'Solicitação não encontrada ou já processada.' });
      }

      return res.json({ ok: true });
    }

    // REJECT: remove o vínculo pendente, a empresa e o usuário
    if (action === 'reject') {
      if (!userId) return next(badRequest('userId obrigatório para reject'));

      const result = await rejectAccessRequest({ userId });
      if (!result.ok) {
        return res.status(404).json({ error: 'Solicitação não encontrada ou já processada.' });
      }

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
        max_mei: 0,
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
        mei: false,
      });
      if (linkErr) throw new Error(linkErr.message);

      if (phone) {
        const cleaned = canonicalizeBrazilWhatsappPhone(phone);
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

    void notifySuperadminAccessRequestSubmitted(sb, {
      fullName,
      email,
      phone: phone || null,
      empresaNome,
      cnpj,
      observacao,
    }).catch(() => {});

    return res.json({ ok: true, userId });
  } catch (err) {
    return next(err);
  }
});

export default router;
