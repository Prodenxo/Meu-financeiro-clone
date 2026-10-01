'use client';

import { Button, Pill } from '@/components/ui';
import { UserAvatar } from '@/components/acessos/shared';
import a from '@/components/acessos/acessos.module.css';
import { formatPhoneDisplay } from '@/lib/acessos/acessos';
import { empresaDocLabel, empresaName, formatDate, formatEmpresaDoc, requesterName } from '@/lib/acessos/solicitacoes';
import c from './solicitacoes.module.css';

/** Um pedido pendente com os mesmos campos do card do app atual + Negar / Aprovar. */
function RequestItem({ req, disabled, acting, onApprove, onReject }) {
  const name = requesterName(req);
  const emp = req.empresa;
  const empName = empresaName(emp);

  return (
    <li className={c.request} aria-busy={acting || undefined}>
      <div className={c.requestGrid}>
        <div className={c.person}>
          <UserAvatar user={{ id: req.userId, displayName: req.fullName, email: req.email }} size={40} />
          <div className={c.stack}>
            <span className={c.label}>Solicitante</span>
            <span className={c.strong}>{req.fullName || 'Sem nome'}</span>
            {req.email ? <span className={c.line}>{req.email}</span> : null}
            {req.phone ? <span className={c.line}>{formatPhoneDisplay(req.phone)}</span> : null}
          </div>
        </div>

        <div className={c.stack}>
          <span className={c.label}>Empresa</span>
          <span className={c.strong}>{empName || '—'}</span>
          <span className={c.line}>
            {empresaDocLabel(emp.cnpj)}: {formatEmpresaDoc(emp.cnpj)}
          </span>
          {emp.razaoSocial && emp.razaoSocial !== empName ? <span className={c.line}>Razão social: {emp.razaoSocial}</span> : null}
          {emp.endereco ? <span className={c.line}>{emp.endereco}</span> : null}
          {emp.telefone ? <span className={c.line}>Tel.: {emp.telefone}</span> : null}
          {emp.email ? <span className={c.line}>{emp.email}</span> : null}
        </div>

        <div className={c.stack}>
          <span className={c.label}>Pedido</span>
          <span>
            <Pill tone="warning" icon="clock">Aguardando aprovação</Pill>
          </span>
          {req.requestedAt ? <span className={c.line}>Solicitado em {formatDate(req.requestedAt)}</span> : null}
        </div>

        {req.observacao ? (
          <p className={c.obs}>
            <span className="sr-only">Observação do solicitante: </span>
            {req.observacao}
          </p>
        ) : null}

        <div className={c.actions}>
          <Button
            variant="outline"
            icon="user-x"
            className={c.rejectBtn}
            disabled={disabled}
            onClick={() => onReject(req)}
            aria-label={`Negar solicitação de ${name}`}
          >
            Negar
          </Button>
          <Button
            icon="user-check"
            className={a.successBtn}
            disabled={disabled}
            aria-busy={acting || undefined}
            onClick={() => onApprove(req)}
            aria-label={`Aprovar solicitação de ${name}`}
          >
            {acting ? 'Processando…' : 'Aprovar'}
          </Button>
        </div>
      </div>
    </li>
  );
}

export function PendingRequests({ requests, actingId, busy, onApprove, onReject }) {
  return (
    <ul className={c.requestList} aria-label="Solicitações pendentes">
      {requests.map((req) => (
        <RequestItem
          key={req.userId}
          req={req}
          acting={actingId === req.userId}
          disabled={busy || Boolean(actingId)}
          onApprove={onApprove}
          onReject={onReject}
        />
      ))}
    </ul>
  );
}
