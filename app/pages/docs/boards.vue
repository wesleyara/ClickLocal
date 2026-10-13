<template>
  <div>
    <h1>Boards, colunas e cards</h1>

    <h2>Boards</h2>
    <p>
      A página inicial lista todos os seus boards. Use <strong>Criar board</strong> para começar um novo e o seletor de boards
      no header para alternar entre eles. Dentro de um board você pode renomear ou excluir o board pelo menu.
    </p>

    <h2>Modelos de board</h2>
    <p>
      Ao criar um board você escolhe um <strong>modelo</strong>: <em>Vazio</em>, <em>Kanban dev</em> (TO-DO, Bugs, In-progress,
      Testing, Done, já com cores) ou <em>To do / Doing / Done</em>. Para reaproveitar a estrutura de um board seu, use
      <strong>Salvar como modelo</strong> no header do board: o modelo guarda as colunas (nome, cor e ordem) e as tags, sem os
      cards. Modelos salvos aparecem no seletor de novo board e podem ser excluídos ali (boards já criados não são afetados).
    </p>

    <h2>Colunas</h2>
    <p>Cada coluna tem <strong>nome</strong> e <strong>cor</strong>. É possível:</p>
    <ul>
      <li>criar colunas novas no fim do board;</li>
      <li>reordenar colunas arrastando;</li>
      <li>editar nome e cor pelo menu da coluna.</li>
    </ul>

    <h2>Cards</h2>
    <p>
      Crie cards diretamente em uma coluna e arraste para mover entre colunas ou reordenar. Ao abrir um card, o topo mostra uma
      etiqueta colorida com o <strong>nome da coluna</strong> onde ele está.
    </p>
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Recurso</th><th>Descrição</th></tr>
        </thead>
        <tbody>
          <tr><td>Descrição</td><td>Editor Markdown (<NuxtLink to="/docs/editor">veja o editor</NuxtLink>)</td></tr>
          <tr><td>Subtarefas</td><td>Checklist simples com itens marcáveis</td></tr>
          <tr><td>Cards filhos</td><td>Cards vinculados a um card pai, para quebrar trabalho maior</td></tr>
          <tr><td>Tags</td><td>Criadas por board, com cor; podem ser associadas a vários cards</td></tr>
          <tr><td>Prazo</td><td>Data de entrega</td></tr>
          <tr><td>Anexos de imagem e vídeo</td><td>Imagens abrem em um visualizador ampliado; vídeos (MP4/WebM, até 100 MB) tocam no próprio card</td></tr>
          <tr><td>Comentários e horas</td><td>Veja <NuxtLink to="/docs/tempo-atividade">Tempo e atividade</NuxtLink></td></tr>
        </tbody>
      </table>
    </div>

    <h3>Arquivar</h3>
    <p>Cards podem ser <strong>arquivados</strong> em vez de excluídos. O diálogo de cards arquivados permite consultar e desarquivar.</p>

    <h2>Busca e filtros</h2>
    <p>No board, o filtro é feito no navegador, por texto e por tags.</p>

    <h2>Atalhos</h2>
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Tecla</th><th>Ação</th></tr>
        </thead>
        <tbody>
          <tr><td><UKbd value="/" /></td><td>Foca o campo de busca</td></tr>
          <tr><td><UKbd value="N" /></td><td>Adiciona um card na primeira coluna</td></tr>
          <tr><td><UKbd value="Enter" /> / <UKbd value="Esc" /></td><td>Confirma ou cancela a edição de nomes</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
