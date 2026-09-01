import { clsx } from 'clsx'
import { splitProps, type ComponentProps } from 'solid-js'

export interface ButtonProps extends ComponentProps<'button'> {
  size?: 'medium' | 'small'
  variant?: 'ghost' | 'primary' | 'secondary'
}

export function Button(props: ButtonProps) {
  const [local, buttonProps] = splitProps(props, [
    'children',
    'class',
    'size',
    'type',
    'variant',
  ])

  return (
    <button
      {...buttonProps}
      class={clsx(
        'button',
        `button--${local.variant ?? 'primary'}`,
        `button--${local.size ?? 'medium'}`,
        local.class,
      )}
      type={local.type ?? 'button'}
    >
      {local.children}
    </button>
  )
}
