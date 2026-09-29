<script setup lang="ts">
const route = useRoute()
const flat = docsNav.flatMap(g => g.items)
const current = computed(() => flat.find(i => i.to === route.path))
const index = computed(() => flat.findIndex(i => i.to === route.path))
const prev = computed(() => (index.value > 0 ? flat[index.value - 1] : undefined))
const next = computed(() => (index.value >= 0 ? flat[index.value + 1] : undefined))

useSeoMeta({ title: () => `${current.value?.label ?? 'Documentação'} · ClickLocal` })
</script>

<template>
  <div class="mx-auto flex w-full max-w-7xl gap-10 px-4 py-8 sm:px-8">
    <aside class="sticky top-20 hidden h-fit w-60 shrink-0 lg:block">
      <div
        v-for="group in docsNav"
        :key="group.title"
        class="mb-6"
      >
        <p class="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-muted">
          {{ group.title }}
        </p>
        <UNavigationMenu
          orientation="vertical"
          :items="group.items.map(i => ({ label: i.label, to: i.to, icon: i.icon, exact: true }))"
        />
      </div>
    </aside>

    <div class="min-w-0 flex-1">
      <div class="mb-6 lg:hidden">
        <USelectMenu
          :model-value="route.path"
          :items="flat.map(i => ({ label: i.label, value: i.to }))"
          value-key="value"
          class="w-full"
          @update:model-value="navigateTo($event as string)"
        />
      </div>

      <DocsProse class="max-w-3xl">
        <NuxtPage />
      </DocsProse>

      <nav class="mt-12 flex max-w-3xl items-center justify-between gap-4 border-t border-default pt-6">
        <UButton
          v-if="prev"
          :to="prev.to"
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="outline"
        >
          {{ prev.label }}
        </UButton>
        <span v-else />
        <UButton
          v-if="next"
          :to="next.to"
          trailing-icon="i-lucide-arrow-right"
          color="neutral"
          variant="outline"
        >
          {{ next.label }}
        </UButton>
      </nav>
    </div>
  </div>
</template>
