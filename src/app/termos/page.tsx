import type { Metadata } from 'next';
import { LegalPage } from '@/components/LegalPage';
import { getSettings } from '@/lib/server/settings';

export const metadata: Metadata = { title: 'Termos de Uso · Clube do Focinho' };

export default async function Termos() {
  const s = await getSettings();
  return (
    <LegalPage title="Termos de Uso" updated="05/11/2026">
      <p>
        Ao usar o site e comprar o Kit Identidade Pet do <b>{s.company.name}</b>
        {s.company.document ? ` (${s.company.document})` : ''}, você concorda com estes termos.
      </p>
      <h2>1. O que é o produto</h2>
      <p>
        O Kit Identidade Pet é um <b>produto digital personalizado de uso pessoal</b>: arquivos para baixar e imprimir (RG do pet, certidão, passaporte de aventuras, tag com QR
        Code, carteira de vacinação, carteirinha de torcedor e bônus) e uma página online do pet ligada à tag.
      </p>
      <h2>2. Sem validade oficial</h2>
      <p>
        Os documentos <b>não têm validade oficial</b> e não substituem documentos emitidos por médico-veterinário ou por órgãos públicos. O RG Animal oficial é emitido
        gratuitamente pelo governo federal (SinPatinhas). A carteira de vacinação serve para organização e não substitui a carteira assinada pelo veterinário. O passaporte é de
        lembrança e não é documento de viagem.
      </p>
      <h2>3. Entrega e acesso</h2>
      <p>
        Após a confirmação do pagamento, o acesso é liberado na hora pela página de obrigado e por um link enviado ao e-mail da compra. Você pode baixar os arquivos e editar os
        dados quantas vezes quiser enquanto o acesso estiver ativo.
      </p>
      <h2>4. Garantia de 7 dias</h2>
      <p>
        Você pode pedir o reembolso integral em até 7 dias após a compra, sem precisar justificar, pelo e-mail {s.support.email} ou pela plataforma de pagamento. Com o reembolso, o
        acesso ao kit e a página do pet são desativados.
      </p>
      <h2>5. Seu conteúdo</h2>
      <p>
        Você é responsável pelas fotos e dados que envia e garante que tem direito de usá-los. Não é permitido usar o serviço para conteúdo ofensivo, para se passar por outra pessoa
        ou para fins ilegais.
      </p>
      <h2>6. Marcas de terceiros</h2>
      <p>
        Nomes e escudos de clubes de futebol pertencem aos seus respectivos donos e aparecem apenas para personalizar a carteirinha de uso pessoal do cliente. O Clube do Focinho não
        tem relação com os clubes.
      </p>
      <h2>7. Página do pet</h2>
      <p>
        A página ligada ao QR Code fica no ar enquanto o acesso estiver ativo. Fazemos o possível para mantê-la sempre disponível, mas não garantimos funcionamento ininterrupto nem
        que o pet será encontrado.
      </p>
      <h2>8. Contato</h2>
      <p>
        Suporte: <b>{s.support.email}</b>
        {s.support.whatsapp ? ` · WhatsApp ${s.support.whatsapp}` : ''}. {s.support.hours}.
      </p>
    </LegalPage>
  );
}
