<script setup lang="ts">
const { connection, pending, refresh } = useAdoConnection()
await refresh()

const toast = useToast()

const orgUrl = ref('')
const pat = ref('')
const testing = ref(false)
const saving = ref(false)
const testedUserName = ref<string | null>(null)

watch(connection, (value) => {
  if (value) orgUrl.value = value.orgUrl
}, { immediate: true })

async function handleTest() {
  if (!orgUrl.value.trim() || !pat.value.trim()) return
  testing.value = true
  testedUserName.value = null
  try {
    const result = await $fetch<{ userName: string }>('/api/integrations/azure-devops/test', {
      method: 'POST',
      body: { orgUrl: orgUrl.value, pat: pat.value }
    })
    testedUserName.value = result.userName
    toast.add({ title: `Conectado como ${result.userName}`, color: 'success' })
  } catch (error) {
    toast.add({ title: 'Falha ao conectar', description: (error as { data?: { statusMessage?: string } })?.data?.statusMessage, color: 'error' })
  } finally {
    testing.value = false
  }
}

async function handleSave() {
  if (!orgUrl.value.trim() || !pat.value.trim()) return
  saving.value = true
  try {
    await $fetch('/api/integrations/azure-devops', {
      method: 'PUT',
      body: { orgUrl: orgUrl.value, pat: pat.value }
    })
    pat.value = ''
    await refresh()
    await refreshProjects()
    toast.add({ title: 'Conexão salva', color: 'success' })
  } catch (error) {
    toast.add({ title: 'Falha ao salvar', description: (error as { data?: { statusMessage?: string } })?.data?.statusMessage, color: 'error' })
  } finally {
    saving.value = false
  }
}

const writeModeOptions = [
  { label: 'Somente leitura', value: 'readonly' },
  { label: 'Dry-run (simula, não escreve)', value: 'dry-run' },
  { label: 'Escrita', value: 'write' }
]

const writeMode = ref<'readonly' | 'dry-run' | 'write'>('readonly')
const allowedProjects = ref<string[]>([])
const projects = ref<string[]>([])
const loadingProjects = ref(false)
const savingWriteSettings = ref(false)

watch(connection, (value) => {
  if (!value) return
  writeMode.value = value.writeMode
  allowedProjects.value = value.writeAllowedProjects
}, { immediate: true })

async function refreshProjects() {
  if (!connection.value) return
  loadingProjects.value = true
  try {
    projects.value = await $fetch<string[]>('/api/integrations/azure-devops/projects')
  } catch {
    projects.value = []
  } finally {
    loadingProjects.value = false
  }
}
if (connection.value) await refreshProjects()

async function handleSaveWriteSettings() {
  savingWriteSettings.value = true
  try {
    await $fetch('/api/integrations/azure-devops/write-settings', {
      method: 'PUT',
      body: { writeMode: writeMode.value, writeAllowedProjects: allowedProjects.value }
    })
    await refresh()
    toast.add({ title: 'Configuração de escrita salva', color: 'success' })
  } finally {
    savingWriteSettings.value = false
  }
}
</script>

<template>
  <div class="px-4 sm:px-8 py-6 sm:py-10 max-w-2xl mx-auto flex flex-col gap-8">
    <div>
      <h1 class="text-xl sm:text-2xl font-extrabold tracking-tight">
        Azure DevOps
      </h1>
      <p class="text-sm text-muted mt-1">
        Conexão de leitura com sua organização. O PAT fica salvo localmente e nunca é devolvido ao client.
      </p>
    </div>

    <div
      v-if="!pending"
      class="bg-default border border-default rounded-2xl p-5 flex flex-col gap-4"
    >
      <div class="flex flex-col gap-1.5">
        <label class="text-[12px] font-bold text-muted">URL da organização</label>
        <UInput
          v-model="orgUrl"
          placeholder="https://dev.azure.com/minha-org"
        />
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-[12px] font-bold text-muted">Personal Access Token</label>
        <UInput
          v-model="pat"
          type="password"
          :placeholder="connection?.hasPat ? '••••••••••• (mantém o atual se em branco)' : 'Cole seu PAT'"
        />
      </div>

      <div
        v-if="connection?.userName"
        class="text-[12.5px] text-muted"
      >
        Conectado como <span class="font-bold text-default">{{ connection.userName }}</span>
        <span v-if="connection.lastSyncedAt"> &middot; última sync {{ new Date(connection.lastSyncedAt).toLocaleString() }}</span>
      </div>

      <div class="flex justify-end gap-2">
        <UButton
          label="Testar"
          color="neutral"
          variant="outline"
          :loading="testing"
          :disabled="!orgUrl.trim() || !pat.trim()"
          @click="handleTest"
        />
        <UButton
          label="Salvar"
          :loading="saving"
          :disabled="!orgUrl.trim() || !pat.trim()"
          @click="handleSave"
        />
      </div>
    </div>

    <div
      v-if="connection"
      class="bg-default border border-default rounded-2xl p-5 flex flex-col gap-4"
    >
      <div>
        <h2 class="text-[15px] font-bold tracking-tight">
          Escrita no Azure DevOps
        </h2>
        <p class="text-[12.5px] text-muted mt-1">
          Controla se e onde o ClickLocal pode escrever de volta no ADO (estado, horas, comentários).
        </p>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-[12px] font-bold text-muted">Modo</label>
        <USelect
          v-model="writeMode"
          :items="writeModeOptions"
          value-key="value"
        />
        <p
          v-if="writeMode === 'write'"
          class="text-[12px] font-bold text-error flex items-center gap-1.5 mt-1"
        >
          <UIcon
            name="i-lucide-triangle-alert"
            class="size-3.5"
          />
          Modo Escrita: mudanças de estado, horas e comentários confirmados serão enviados de verdade ao Azure DevOps.
        </p>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-[12px] font-bold text-muted">Projetos com escrita permitida</label>
        <USelectMenu
          v-model="allowedProjects"
          :items="projects"
          :loading="loadingProjects"
          multiple
          placeholder="Nenhum projeto liberado"
        />
      </div>

      <div class="flex justify-end">
        <UButton
          label="Salvar configuração de escrita"
          :loading="savingWriteSettings"
          @click="handleSaveWriteSettings"
        />
      </div>
    </div>
  </div>
</template>
