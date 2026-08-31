<script setup lang="ts">
import type { ActivityEntry } from '~/composables/useActivity'

defineProps<{ entries: ActivityEntry[] }>()

function formatDuration(ms: number) {
  const totalMinutes = Math.round(ms / 60000)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return h === 0 ? `${m}m` : `${h}h ${m}m`
}

function describe(entry: ActivityEntry): { icon: string, text: string } {
  const payload = entry.payload ?? {}

  switch (entry.eventType) {
    case 'card_created':
      return { icon: 'i-lucide-plus', text: 'Card created' }
    case 'title_changed':
      return { icon: 'i-lucide-pencil', text: `Renamed to "${payload.to}"` }
    case 'description_changed':
      return { icon: 'i-lucide-pencil', text: 'Updated the description' }
    case 'moved_column':
      return { icon: 'i-lucide-arrow-right-left', text: 'Moved to another column' }
    case 'due_date_changed':
      return { icon: 'i-lucide-calendar', text: payload.to ? 'Changed the due date' : 'Removed the due date' }
    case 'card_archived':
      return { icon: 'i-lucide-archive', text: 'Archived the card' }
    case 'card_unarchived':
      return { icon: 'i-lucide-archive-restore', text: 'Restored the card' }
    case 'subtask_added':
      return { icon: 'i-lucide-check-square', text: `Added subtask "${payload.title}"` }
    case 'subtask_completed':
      return { icon: 'i-lucide-check-square', text: `Completed subtask "${payload.title}"` }
    case 'subtask_reopened':
      return { icon: 'i-lucide-square', text: `Reopened subtask "${payload.title}"` }
    case 'subtask_removed':
      return { icon: 'i-lucide-x', text: `Removed subtask "${payload.title}"` }
    case 'child_card_added':
      return { icon: 'i-lucide-git-branch', text: `Added subtask card "${payload.title}"` }
    case 'tag_added':
      return { icon: 'i-lucide-tag', text: `Added tag "${payload.tagName}"` }
    case 'tag_removed':
      return { icon: 'i-lucide-tag', text: `Removed tag "${payload.tagName}"` }
    case 'comment_added':
      return { icon: 'i-lucide-message-square', text: 'Added a comment' }
    case 'time_entry_added':
      return {
        icon: 'i-lucide-clock',
        text: `Logged ${formatDuration(payload.durationMs as number)}${payload.source === 'manual' ? ' manually' : ''}`
      }
    default:
      return { icon: 'i-lucide-circle', text: entry.eventType }
  }
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <span class="text-[11.5px] font-extrabold uppercase tracking-wide text-muted">Activity</span>

    <div
      v-if="!entries.length"
      class="text-[12.5px] text-muted"
    >
      No activity yet.
    </div>

    <div
      v-else
      class="flex flex-col gap-3.5"
    >
      <div
        v-for="entry in entries"
        :key="entry.id"
        class="flex gap-2.5"
      >
        <div class="size-[22px] rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <UIcon
            :name="describe(entry).icon"
            class="size-3 text-primary"
          />
        </div>
        <div class="text-[12.5px] leading-snug">
          {{ describe(entry).text }}
          <div class="text-[11px] text-muted">
            {{ new Date(entry.createdAt).toLocaleString() }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
