<template>
  <div>
    <h1>Tempo e atividade</h1>

    <h2>Controle de tempo</h2>
    <p>Cada card tem um <strong>rastreador de tempo</strong> com duas formas de registrar horas:</p>
    <ul>
      <li><strong>Cronômetro</strong>: inicie ao começar a trabalhar e pare ao terminar. O período vira um registro no card.</li>
      <li><strong>Lançamento manual</strong>: informe início, duração e uma anotação opcional.</li>
    </ul>
    <p>
      Você pode excluir registros, exceto os que já foram <strong>enviados ao Azure DevOps</strong> (ficam travados; veja
      <NuxtLink to="/docs/azure-devops">Azure DevOps</NuxtLink>).
    </p>

    <h2>Comentários</h2>
    <p>
      Os comentários aceitam Markdown, com o mesmo editor da descrição. É possível editá-los e excluí-los. Em cards vinculados
      ao Azure DevOps, você pode publicar um comentário local como comentário no work item.
    </p>

    <h2>Histórico de atividade</h2>
    <p>
      Cada card mantém um <strong>feed de atividade</strong> com o histórico de mudanças: movimentações entre colunas, edições,
      arquivamento, tags, e também as escritas feitas no Azure DevOps.
    </p>
  </div>
</template>
