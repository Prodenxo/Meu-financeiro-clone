import { Pill } from '@/components/ui';
import { UserAvatar } from '@/components/acessos/shared';
import a from '@/components/acessos/acessos.module.css';
import { HISTORY_EVENTS, empresaDocLabel, formatDateTime, formatEmpresaDoc } from '@/lib/acessos/solicitacoes';
import c from './solicitacoes.module.css';

/** Histórico somente leitura: decisões já tomadas não podem ser refeitas por aqui. */
function StatusPill({ entry }) {
  const ev = HISTORY_EVENTS[entry.eventType];
  return <Pill tone={ev.tone}>{ev.label}</Pill>;
}

function Person({ entry }) {
  return (
    <div className={a.userCell}>
      <UserAvatar user={{ id: entry.id, displayName: entry.fullName, email: entry.email }} />
      <div className={a.userText}>
        <span className={a.userName}>{entry.fullName || 'Sem nome'}</span>
        {entry.email ? <span className={a.userEmail}>{entry.email}</span> : null}
      </div>
    </div>
  );
}

function Empresa({ entry }) {
  return (
    <div className={c.stack}>
      <span className={a.ellipsis}>{entry.empresaNome || '—'}</span>
      {entry.cnpj ? (
        <span className={c.line}>
          {empresaDocLabel(entry.cnpj)}: {formatEmpresaDoc(entry.cnpj)}
        </span>
      ) : null}
    </div>
  );
}

const dash = (v) => v || '—';

export function HistoryList({ entries }) {
  return (
    <>
      <table className={a.table}>
        <caption className="sr-only">Histórico de solicitações de acesso</caption>
        <thead>
          <tr>
            <th scope="col" className={c.colPerson}>Solicitante</th>
            <th scope="col" className={c.colEmpresa}>Empresa</th>
            <th scope="col" className={c.colStatus}>Status</th>
            <th scope="col" className={c.colDate}>Solicitado em</th>
            <th scope="col" className={c.colDate}>Aprovado em</th>
            <th scope="col" className={c.colActor}>Responsável</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id}>
              <td><Person entry={e} /></td>
              <td><Empresa entry={e} /></td>
              <td><StatusPill entry={e} /></td>
              <td className={a.small}>{dash(formatDateTime(e.requestedAt))}</td>
              <td className={a.small}>{dash(formatDateTime(e.approvedAt))}</td>
              <td className={`${a.small} ${a.ellipsis}`} title={e.actorEmail || undefined}>{dash(e.actorEmail)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className={a.cards} aria-label="Histórico de solicitações de acesso" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {entries.map((e) => (
          <li key={e.id} className={a.itemCard}>
            <Person entry={e} />
            <div>
              <StatusPill entry={e} />
            </div>
            <div className={a.itemMeta}>
              <div style={{ gridColumn: '1 / -1' }}>
                <span className={a.itemMetaLabel}>Empresa</span>
                <Empresa entry={e} />
              </div>
              <div>
                <span className={a.itemMetaLabel}>Solicitado em</span>
                {dash(formatDateTime(e.requestedAt))}
              </div>
              <div>
                <span className={a.itemMetaLabel}>Aprovado em</span>
                {dash(formatDateTime(e.approvedAt))}
              </div>
              {e.actorEmail ? (
                <div style={{ gridColumn: '1 / -1', overflowWrap: 'anywhere' }}>
                  <span className={a.itemMetaLabel}>Responsável</span>
                  {e.actorEmail}
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
