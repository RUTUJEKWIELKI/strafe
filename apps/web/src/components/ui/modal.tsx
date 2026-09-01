import { Dialog } from '@kobalte/core/dialog'
import { X } from 'lucide-solid'
import type { ParentProps } from 'solid-js'

export interface ModalProps extends ParentProps {
  description: string
  title: string
  triggerLabel: string
}

export function Modal(props: ModalProps) {
  return (
    <Dialog>
      <Dialog.Trigger class="button button--secondary button--medium">
        {props.triggerLabel}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay class="modal__overlay" />
        <div class="modal__positioner">
          <Dialog.Content class="modal__content">
            <div>
              <p class="eyebrow">Launchpad</p>
              <Dialog.Title class="modal__title">{props.title}</Dialog.Title>
              <Dialog.Description class="modal__description">
                {props.description}
              </Dialog.Description>
            </div>
            <div class="modal__body">{props.children}</div>
            <Dialog.CloseButton class="icon-button" aria-label="Close dialog">
              <X aria-hidden="true" size={18} />
            </Dialog.CloseButton>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog>
  )
}
