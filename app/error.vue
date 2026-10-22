<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const notFound = computed(() => props.error.statusCode === 404)

const title = computed(() => notFound.value ? 'Página não encontrada' : 'Algo deu errado')
const description = computed(() => notFound.value
  ? 'O endereço não existe, ou o board/card foi removido.'
  : 'Ocorreu um erro inesperado. Tente de novo; se persistir, veja os logs do servidor.')

useHead({ htmlAttrs: { lang: 'pt-BR' } })
useSeoMeta({ title: () => `${props.error.statusCode} · ClickLocal` })

function goHome() {
  clearError({ redirect: '/' })
}

function retry() {
  // a full reload re-runs SSR, which is what actually retries the failed load
  reloadNuxtApp({ force: true })
}
</script>

<template>
  <UApp>
    <div class="min-h-dvh flex flex-col items-center justify-center gap-8 px-4 py-12 bg-default">
      <NuxtLink
        to="/"
        class="flex items-center gap-2"
        @click.prevent="goHome"
      >
        <div class="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
          <UIcon
            name="i-lucide-layout-dashboard"
            class="size-4 text-white"
          />
        </div>
        <span class="font-extrabold text-[15px] tracking-tight">ClickLocal</span>
      </NuxtLink>

      <div class="flex flex-col items-center text-center gap-3 max-w-md">
        <p class="text-6xl font-extrabold tracking-tight text-primary">
          {{ error.statusCode }}
        </p>
        <h1 class="text-xl font-bold">
          {{ title }}
        </h1>
        <p class="text-sm text-muted">
          {{ description }}
        </p>
        <p
          v-if="!notFound && error.message"
          class="text-xs text-dimmed font-mono break-all"
        >
          {{ error.message }}
        </p>
      </div>

      <div class="flex flex-wrap justify-center gap-2">
        <UButton
          icon="i-lucide-layout-dashboard"
          @click="goHome"
        >
          Voltar aos boards
        </UButton>
        <UButton
          v-if="!notFound"
          icon="i-lucide-rotate-cw"
          color="neutral"
          variant="outline"
          @click="retry"
        >
          Tentar de novo
        </UButton>
      </div>
    </div>
  </UApp>
</template>
