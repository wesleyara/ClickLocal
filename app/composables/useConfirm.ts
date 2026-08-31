interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  color?: 'error' | 'primary'
}

interface ConfirmState extends ConfirmOptions {
  open: boolean
  resolve: ((value: boolean) => void) | null
}

const state = reactive<ConfirmState>({
  open: false,
  title: '',
  description: undefined,
  confirmLabel: 'Confirmar',
  color: 'error',
  resolve: null
})

export function useConfirmState() {
  return state
}

export function useConfirm() {
  function confirm(options: ConfirmOptions) {
    return new Promise<boolean>((resolve) => {
      state.title = options.title
      state.description = options.description
      state.confirmLabel = options.confirmLabel ?? 'Confirmar'
      state.color = options.color ?? 'error'
      state.resolve = resolve
      state.open = true
    })
  }

  return { confirm }
}
