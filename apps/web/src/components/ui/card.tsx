import { clsx } from 'clsx'
import { splitProps, type ComponentProps } from 'solid-js'

export function Card(props: ComponentProps<'section'>) {
  const [local, sectionProps] = splitProps(props, ['class'])

  return (
    <section {...sectionProps} class={clsx('card', local.class)}>
      {props.children}
    </section>
  )
}
