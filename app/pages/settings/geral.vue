<script setup lang="ts">
import type { AppSettings } from '~~/server/utils/settings'

const toast = useToast()

const { data: settings, pending } = await useFetch<AppSettings>('/api/settings')

const form = reactive({ dailyGoalHours: 0, forgottenTimerHours: 0 })
const saving = ref(false)

watch(settings, (value) => {
  if (value) Object.assign(form, value)
}, { immediate: true })

const dirty = computed(() => !!settings.value && (Object.keys(form) as (keyof AppSettings)[]).some(key => form[key] !== settings.value![key]))

async function handleSave() {
  saving.value = true
  try {
    settings.value = await $fetch<AppSettings>('/api/settings', { method: 'PATCH', body: { ...form } })
    toast.add({ title: 'Configurações salvas', color: 'success' })
  } catch (error) {
    toast.add({ title: 'Falha ao salvar', description: (error as { data?: { statusMessage?: string } })?.data?.statusMessage, color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="px-4 sm:px-8 py-6 sm:py-10 max-w-3xl mx-auto flex flex-col gap-6">
    <div>
      <h1 class="text-xl sm:text-2xl font-extrabold tracking-tight">
        Geral
      </h1>
      <p class="text-sm text-muted mt-1">
        Metas e alertas do app. Ficam salvos no banco local e entram no backup junto com o resto dos dados.
      </p>
    </div>

    <div
      v-if="!pending"
      class="bg-default border border-default rounded-2xl p-5 flex flex-col gap-4"
    >
      <div class="flex flex-col gap-1.5">
        <label class="text-[12px] font-bold text-muted">Meta diária (horas)</label>
        <UInputNumber
          v-model="form.dailyGoalHours"
          :min="0"
          :max="24"
          :step="0.5"
          class="max-w-40"
        />
        <p class="text-[12px] text-muted">
          Horas registradas por dia que você quer atingir. Use 0 para desativar.
        </p>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-[12px] font-bold text-muted">Alerta de timer esquecido (horas)</label>
        <UInputNumber
          v-model="form.forgottenTimerHours"
          :min="0"
          :max="24"
          :step="0.5"
          class="max-w-40"
        />
        <p class="text-[12px] text-muted">
          Avisa quando um timer fica rodando por mais tempo que isso. Use 0 para desativar.
        </p>
      </div>

      <div class="flex justify-end gap-2">
        <UButton
          label="Salvar"
          :loading="saving"
          :disabled="!dirty"
          @click="handleSave"
        />
      </div>
    </div>
  </div>
</template>
