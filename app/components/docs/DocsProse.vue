<template>
  <div class="docs-prose">
    <slot />
  </div>
</template>

<style scoped>
.docs-prose {
  line-height: 1.7;
  color: var(--ui-text-toned);
}
.docs-prose :deep(h1) {
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--ui-text-highlighted);
  margin-bottom: 0.75rem;
}
.docs-prose :deep(h2) {
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--ui-text-highlighted);
  margin: 2.25rem 0 0.75rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--ui-border);
}
.docs-prose :deep(h3) {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--ui-text-highlighted);
  margin: 1.5rem 0 0.5rem;
}
.docs-prose :deep(p) {
  margin: 0.75rem 0;
}
.docs-prose :deep(ul),
.docs-prose :deep(ol) {
  margin: 0.75rem 0;
  padding-left: 1.5rem;
}
.docs-prose :deep(ul) { list-style: disc; }
.docs-prose :deep(ol) { list-style: decimal; }
.docs-prose :deep(li) { margin: 0.25rem 0; }
.docs-prose :deep(a:not(.no-prose)) {
  color: var(--ui-primary);
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.docs-prose :deep(code:not(pre code)) {
  background: var(--ui-bg-elevated);
  border: 1px solid var(--ui-border);
  border-radius: 6px;
  padding: 0.1rem 0.35rem;
  font-size: 0.85em;
}
.docs-prose :deep(.table-wrap) {
  margin: 1rem 0;
  overflow-x: auto;
  border: 1px solid var(--ui-border);
  border-radius: 12px;
}
.docs-prose :deep(table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}
.docs-prose :deep(th) {
  text-align: left;
  font-weight: 700;
  background: var(--ui-bg-elevated);
  color: var(--ui-text-highlighted);
}
.docs-prose :deep(th),
.docs-prose :deep(td) {
  padding: 0.6rem 0.9rem;
  border-bottom: 1px solid var(--ui-border);
  vertical-align: top;
}
.docs-prose :deep(tr:last-child td) { border-bottom: 0; }
</style>
