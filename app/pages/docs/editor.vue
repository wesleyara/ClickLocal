<script setup lang="ts">
const mermaidSample = `flowchart LR
  A[Backlog] --> B[Em andamento] --> C[Concluído]`
const fence = '```'
const mdSample = `${fence}mermaid
${mermaidSample}
${fence}`
</script>

<template>
  <div>
    <h1>Editor Markdown e Mermaid</h1>
    <p>
      A descrição e os comentários dos cards usam um editor Markdown com <strong>toolbar personalizada</strong> e alternância
      entre <strong>Editor</strong> e <strong>Preview</strong>.
    </p>

    <h2>Toolbar</h2>
    <ul>
      <li><strong>Formatação</strong>: negrito, itálico, sublinhado, tachado.</li>
      <li><strong>Títulos</strong>: menu de H1 a H6, além de subscrito e sobrescrito.</li>
      <li><strong>Listas</strong>: com marcadores, numeradas e de tarefas.</li>
      <li>
        <strong>Inserir</strong>: citação, código inline, bloco de código, link, imagem, tabela,
        <strong>Diagrama (Mermaid)</strong> e <strong>Fórmula (KaTeX)</strong>.
      </li>
    </ul>
    <p>
      Blocos de código exibem numeração de linhas. O botão de <strong>expandir preview</strong> abre a visualização em tela cheia.
    </p>

    <h2>Diagramas Mermaid</h2>
    <p>
      No menu <strong>Inserir</strong>, escolha <em>Diagram</em> para adicionar um bloco Mermaid. Ele é escrito como um bloco de
      código com a linguagem <code>mermaid</code>:
    </p>
    <DocsCode
      :code="mdSample"
      lang="markdown"
    />
    <p>Que resulta em:</p>
    <DocsMermaid :code="mermaidSample" />
    <p>O diagrama é renderizado no Preview. O Mermaid é carregado sob demanda para não pesar a abertura do app.</p>

    <h2>Fórmulas</h2>
    <p>Use <em>Formula</em> no menu <strong>Inserir</strong> para escrever expressões em KaTeX, como <code>$$ E = mc^2 $$</code>.</p>

    <h2>Imagens e vídeos</h2>
    <p>Você pode enviar imagens (até 10 MB) pelo editor. No Preview, clique na imagem para abri-la no visualizador ampliado.</p>
    <p>Para usar como evidência, envie vídeos <strong>MP4</strong> ou <strong>WebM</strong> de até 100 MB: use <em>Video</em> no menu <strong>Inserir</strong>, ou cole/arraste o arquivo no editor. No Preview o vídeo aparece com controles de reprodução.</p>
  </div>
</template>
