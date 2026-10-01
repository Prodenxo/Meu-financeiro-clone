'use client';

import { Card, CardHeader } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import s from './contaGlobal.module.css';

const ITEMS = [
  { icon: 'banknote', title: 'Saldo em moeda original', text: 'Visualize o saldo de cada moeda cadastrada.' },
  { icon: 'arrow-left-right', title: 'Conversão estimada em reais', text: 'Os valores são exibidos com base em cotações de referência.' },
  { icon: 'settings', title: 'Gestão por moeda', text: 'Edite ou exclua cada saldo no menu do card.' },
];

/** Card "Informações" — textos curtos sobre como a Conta global funciona. */
export function InfoCard() {
  return (
    <Card aria-labelledby="cg-info-title">
      <CardHeader title="Informações" icon="circle-help" id="cg-info-title" />
      <div>
        {ITEMS.map((item) => (
          <div key={item.title} className={s.infoRow}>
            <span className={s.infoIcon}>
              <Icon name={item.icon} size={16} />
            </span>
            <span className={s.infoText}>
              <span className={s.infoTitle}>{item.title}</span>
              <span className={s.infoDesc}>{item.text}</span>
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
