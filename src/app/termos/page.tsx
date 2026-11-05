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
        O Kit Identidade Pet é um <b>produto digital personalizado de uso pessoal</b>: arquivos para imprimir (RG do pet, CNH Pet, certidão, passaporte de aventuras, tag
        ossinho com QR Code, carteira de vacinação, carteirinha de torcedor e bônus) e a imagem de identidade do pet que abre pelo QR Code.
      </p>
      <h2>2. Sem validade oficial</h2>
      <p>
        Os documentos <b>não têm validade oficial</b> e não substituem documentos emitidos por médico-veterinário ou por órgãos públicos. O RG Animal oficial é emitido
        gratuitamente pelo governo federal (SinPatinhas). A carteira de vacinação serve para organização e não substitui a carteira assinada pelo veterinário. O passaporte é de
        lembrança e não é documento de viagem.
      </p>
      <h2>3. Entrega e acesso</h2>
      <p>
        Após a confirmação do pagamento, você confere os dados do pet uma única vez e recebe todos os arquivos no e-mail da compra. Revise com atenção antes de gerar: depois disso,
        alterações só pelo suporte.
      </p>
      <h2>4. Garantia de 7 dias</h2>
      <p>
        Você pode pedir o reembolso integral em até 7 dias após a compra, sem precisar justificar, pelo e-mail {s.support.email} ou pela plataforma de pagamento. Com o reembolso, o
        acesso aos arquivos é desativado.
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
      <h2>7. Identidade do QR Code</h2>
      <p>
        A imagem ligada ao QR Code fica disponível online. Fazemos o possível para mantê-la sempre no ar, mas não garantimos funcionamento ininterrupto nem que o pet será
        encontrado.
      </p>
      <h2>8. Contato</h2>
      <p>
        Suporte: <b>{s.support.email}</b>
        {s.support.whatsapp ? ` · WhatsApp ${s.support.whatsapp}` : ''}. {s.support.hours}.
      </p>
    </LegalPage>
  );
}
