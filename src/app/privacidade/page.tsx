import type { Metadata } from 'next';
import { LegalPage } from '@/components/LegalPage';
import { getSettings } from '@/lib/server/settings';

export const metadata: Metadata = { title: 'Política de Privacidade · Clube do Focinho' };

export default async function Privacidade() {
  const s = await getSettings();
  const who = `${s.company.name}${s.company.document ? ` (${s.company.document})` : ''}`;
  return (
    <LegalPage title="Política de Privacidade" updated="05/11/2026">
      <p>
        Esta política explica como o <b>{who}</b> (“Clube do Focinho”, “nós”) coleta e usa seus dados quando você monta o Kit Identidade Pet. Seguimos a Lei Geral de Proteção de
        Dados (Lei 13.709/2018 — LGPD).
      </p>
      <h2>1. Quais dados coletamos</h2>
      <ul>
        <li>
          <b>Dados do pet</b> que você informa no quiz e na área do pet: nome, espécie, raça, sexo, datas, personalidade, foto, time, cidade, dados de saúde e de veterinário.
        </li>
        <li>
          <b>Seus dados de contato</b>: WhatsApp, e-mail, nome dos tutores e contatos de emergência que você cadastrar.
        </li>
        <li>
          <b>Dados de navegação</b>: páginas e etapas do quiz visitadas, origem do anúncio (UTMs) e cookies de medição (Pixel da Meta e Utmify).
        </li>
        <li>
          <b>Dados da compra</b>, recebidos da plataforma de pagamento: nome, e-mail, telefone, produto e status do pedido. Não recebemos nem guardamos dados de cartão.
        </li>
      </ul>
      <h2>2. Para que usamos</h2>
      <ul>
        <li>Montar e entregar os documentos personalizados e a página do pet.</li>
        <li>Enviar o kit para o seu e-mail depois do pagamento.</li>
        <li>Prestar suporte e falar com você sobre o kit (inclusive lembrar quem começou e não terminou).</li>
        <li>Medir e melhorar nossos anúncios e páginas.</li>
      </ul>
      <p>
        A base legal é o seu consentimento (dado na tela de contato), a execução do contrato de compra e nosso legítimo interesse em medir e melhorar o serviço.
      </p>
      <h2>3. Identidade do pet no QR Code</h2>
      <p>
        A tag com QR Code abre uma imagem com a identidade do pet: foto, dados, endereço e os contatos que você informou na confirmação. Ela existe para que quem encontrar seu
        pet consiga falar com você, e qualquer pessoa com a tag em mãos consegue ver. Informe só o que quiser que apareça. Para corrigir ou apagar, fale com o suporte.
      </p>
      <h2>4. Com quem compartilhamos</h2>
      <ul>
        <li>Plataforma de pagamento (processa a compra).</li>
        <li>Supabase (banco de dados e armazenamento das fotos e dos arquivos do kit) e Vercel (hospedagem do site).</li>
        <li>Meta (Facebook/Instagram) e Utmify, para medir anúncios.</li>
        <li>Serviço de envio de e-mail, para mandar seu link de acesso.</li>
      </ul>
      <p>Não vendemos seus dados.</p>
      <h2>5. Por quanto tempo guardamos</h2>
      <p>
        Enquanto seu acesso estiver ativo ou enquanto for necessário para cumprir obrigações legais. Dados de quem não concluiu a compra são apagados em até 12 meses.
      </p>
      <h2>6. Seus direitos</h2>
      <p>
        Você pode pedir a qualquer momento acesso, correção, portabilidade ou exclusão dos seus dados e revogar o consentimento, pelo e-mail <b>{s.support.email}</b>.
        Respondemos em até 15 dias.
      </p>
      <h2>7. Segurança</h2>
      <p>Os dados ficam em servidores com acesso restrito e conexão criptografada. Seu acesso ao kit é feito por um link exclusivo: não compartilhe esse link.</p>
      <h2>8. Contato</h2>
      <p>
        Dúvidas sobre privacidade: <b>{s.support.email}</b>.
      </p>
    </LegalPage>
  );
}
