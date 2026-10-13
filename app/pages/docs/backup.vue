<script setup lang="ts">
const flowDiagram = `flowchart TD
  U[Você envia o .zip] --> V{Validação}
  V -->|inválido| R[Recusado, nada muda]
  V -->|ok| P[Cópia dos dados atuais em data/backups]
  P --> S[Troca banco e anexos]
  S --> M{Backup mais antigo?}
  M -->|sim| D[prisma migrate deploy]
  M -->|não| F[Pronto]
  D --> F`

const manualCode = `docker compose down
unzip clicklocal-backup-*.zip -d restore
cp restore/clicklocal.db data/clicklocal.db
rm -rf data/uploads && cp -r restore/uploads data/uploads
docker compose up -d`
</script>

<template>
  <div>
    <h1>Backup e restauração</h1>
    <p>
      Todos os seus dados ficam em dois lugares: o banco SQLite e a pasta de anexos (<code>data/uploads</code>). O backup junta os dois em
      um único <code>.zip</code> que você baixa pelo navegador e guarda onde quiser. Não há nuvem nem agendamento: o backup roda quando você pede.
    </p>

    <h2>Fazer backup</h2>
    <p>Acesse <NuxtLink to="/settings/backup">Backup</NuxtLink> no header e clique em <strong>Baixar backup</strong>.</p>
    <p>O arquivo se chama <code>clicklocal-backup-AAAA-MM-DDTHH-MM-SS.zip</code> e contém:</p>
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Entrada</th><th>Conteúdo</th></tr>
        </thead>
        <tbody>
          <tr><td><code>clicklocal.db</code></td><td>Snapshot consistente do banco, feito com <code>VACUUM INTO</code>. Pode ser gerado com o app em uso.</td></tr>
          <tr><td><code>uploads/</code></td><td>Todas as imagens e vídeos anexados aos cards.</td></tr>
          <tr><td><code>manifest.json</code></td><td>Data do backup e lista de migrations do banco.</td></tr>
        </tbody>
      </table>
    </div>

    <h2>Restaurar um backup</h2>
    <p>
      Em <NuxtLink to="/settings/backup">Backup</NuxtLink>, use <strong>Escolher .zip e restaurar</strong>, selecione um arquivo gerado pelo ClickLocal e confirme.
      Não há limite prático de tamanho: o arquivo é enviado e descompactado em stream, direto para o disco, sem ocupar memória.
    </p>
    <DocsCallout
      type="warning"
      title="Isso sobrescreve os dados atuais"
    >
      A restauração substitui todos os boards, cards, comentários, horas e anexos pelo conteúdo do .zip, inclusive a conexão com o Azure DevOps (PAT e modo de escrita).
    </DocsCallout>

    <h3>O que é validado</h3>
    <p>Antes de mudar qualquer coisa, o servidor confere o arquivo e recusa com uma mensagem clara se algo falhar:</p>
    <ul>
      <li>é um .zip válido, sem caminhos inseguros (como <code>../</code>) e sem entradas fora do formato acima;</li>
      <li>contém o <code>clicklocal.db</code> e ele abre como SQLite;</li>
      <li>o <code>PRAGMA integrity_check</code> do banco retorna <code>ok</code>;</li>
      <li>tem as tabelas principais (boards, colunas, cards e anexos) e, se for da mesma versão do app, todas as demais;</li>
      <li>não foi gerado por uma versão <strong>mais nova</strong> do ClickLocal.</li>
    </ul>

    <h3>O que acontece depois da validação</h3>
    <DocsMermaid :code="flowDiagram" />
    <ol>
      <li>
        O ClickLocal guarda um <code>.zip</code> dos dados atuais em <code>data/backups/pre-restore-*.zip</code>. Só os <strong>3 mais recentes</strong> são mantidos.
        Se algo não for o que você esperava, restaure esse arquivo.
      </li>
      <li>O banco e a pasta de anexos são trocados e a página recarrega. Não precisa reiniciar o container.</li>
      <li>
        Se o backup for de uma versão mais antiga do app, as migrations que faltam são aplicadas automaticamente.
      </li>
    </ol>
    <p>
      Se o banco referenciar anexos que não estão no .zip, a restauração conclui e avisa quantos arquivos estavam ausentes.
    </p>

    <h2>Restaurar manualmente</h2>
    <p>Se a interface não estiver acessível, restaure pelo terminal, com o app parado (exemplo com Docker):</p>
    <DocsCode
      :code="manualCode"
      lang="bash"
    />
    <p>Fora do Docker, o banco fica em <code>prisma/data/clicklocal.db</code> e os anexos em <code>data/uploads</code>.</p>

    <h2 id="anexos-orfaos">
      Anexos órfãos
    </h2>
    <p>
      Imagens e vídeos só são ligados a um card pelo link dentro do Markdown da descrição ou dos comentários. Se você apaga a imagem do texto,
      o arquivo continua no disco e no backup. Em <NuxtLink to="/settings/anexos">Anexos</NuxtLink> você vê esses <strong>anexos órfãos</strong> de todos os boards de uma vez.
    </p>
    <ul>
      <li>Cada item mostra miniatura, nome, tamanho, data e o board e card de origem.</li>
      <li>Marque os que quer remover (ou <strong>Selecionar todos</strong>) e clique em <strong>Excluir</strong>. O botão mostra o espaço que será liberado.</li>
      <li>Um anexo só é considerado órfão se o link <code>/api/attachments/&lt;id&gt;</code> não aparecer em nenhuma descrição ou comentário. Anexos enviados nas últimas 24h nunca são listados, para não pegar uma imagem de um editor ainda não salvo.</li>
    </ul>
    <DocsCallout
      type="warning"
      title="A exclusão é definitiva"
    >
      Não existe lixeira: o arquivo é apagado do disco e do banco. Se quiser uma rede de segurança, baixe um backup antes. Excluir um card já remove os anexos dele.
    </DocsCallout>

    <h2>Limites e cuidados</h2>
    <ul>
      <li>
        Durante a restauração, o .zip enviado e o conteúdo extraído ficam em <code>data/</code> ao mesmo tempo, então garanta espaço livre
        para cerca de <strong>duas vezes o tamanho do backup</strong>, além da cópia <code>pre-restore</code>. Há um teto de segurança de 20 GB.
      </li>
      <li>O backup também é montado dentro de <code>data/</code> antes do download, então precisa de espaço livre equivalente ao seu tamanho.</li>
      <li>O .zip contém o PAT do Azure DevOps salvo no banco. Guarde o arquivo como guardaria uma senha.</li>
    </ul>
  </div>
</template>
