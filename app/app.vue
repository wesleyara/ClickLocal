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
    <UHeader
      :toggle="false"
      :ui="{ container: 'max-w-none w-full px-4 sm:px-8' }"
    >
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
        <UButton
          to="/settings/azure-devops"
          icon="i-lucide-plug-zap"
          color="neutral"
          variant="ghost"
          size="sm"
        >
          <span class="hidden sm:inline">Azure DevOps</span>
        </UButton>
        <UButton
          to="/settings/anexos"
          icon="i-lucide-paperclip"
          color="neutral"
          variant="ghost"
          size="sm"
        >
          <span class="hidden sm:inline">Anexos</span>
        </UButton>
        <UButton
          to="/settings/backup"
          icon="i-lucide-database-backup"
          color="neutral"
          variant="ghost"
          size="sm"
        >
          <span class="hidden sm:inline">Backup</span>
        </UButton>
        <UButton
          to="/docs"
          icon="i-lucide-book-open"
          color="neutral"
          variant="ghost"
          size="sm"
        >
          <span class="hidden sm:inline">Docs</span>
        </UButton>
        <UColorModeButton />
      </template>
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>

    <ConfirmDialog />
  </UApp>
</template>
