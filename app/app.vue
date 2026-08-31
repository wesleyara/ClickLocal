<script setup lang="ts">
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  htmlAttrs: {
    lang: 'pt-BR'
  }
})

useSeoMeta({
  title: 'ClickLocal',
  description: 'Board local de tasks, sem nuvem e sem autenticação.'
})
</script>

<template>
  <UApp>
    <UHeader :toggle="false">
      <template #left>
        <NuxtLink
          to="/"
          class="flex items-center gap-2 focus-visible:outline-3 outline-primary/25 rounded-md p-1 -ms-1"
        >
          <div class="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <UIcon
              name="i-lucide-layout-dashboard"
              class="size-4 text-white"
            />
          </div>
          <span class="font-extrabold text-[15px] tracking-tight">ClickLocal</span>
        </NuxtLink>
      </template>

      <template #right>
        <BoardSwitcher />
        <UColorModeButton />
      </template>
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>

    <ConfirmDialog />
  </UApp>
</template>
