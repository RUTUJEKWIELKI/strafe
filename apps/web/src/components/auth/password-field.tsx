import { Eye, EyeOff } from 'lucide-solid'
import { createSignal } from 'solid-js'
import { useTranslation } from 'solid-i18next'

interface PasswordFieldProps {
  autocomplete: 'current-password' | 'new-password'
  disabled: boolean
  error?: string
  hint?: string
  onInput: (value: string) => void
  value: string
}

export function PasswordField(props: PasswordFieldProps) {
  const [visible, setVisible] = createSignal(false)
  const [t] = useTranslation()
  const describedBy = () =>
    props.error ? 'password-error' : props.hint ? 'password-hint' : undefined

  return (
    <div class="form-field">
      <label for="password">{t('auth.common.password')}</label>
      <div class="password-input">
        <input
          id="password"
          name="password"
          type={visible() ? 'text' : 'password'}
          autocomplete={props.autocomplete}
          disabled={props.disabled}
          aria-invalid={Boolean(props.error)}
          aria-describedby={describedBy()}
          value={props.value}
          onInput={(event) => props.onInput(event.currentTarget.value)}
        />
        <button
          type="button"
          disabled={props.disabled}
          aria-label={
            visible()
              ? t('auth.common.hidePassword')
              : t('auth.common.showPassword')
          }
          onClick={() => setVisible(!visible())}
        >
          {visible() ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {props.error ? (
        <p class="field-message field-message--error" id="password-error">
          {props.error}
        </p>
      ) : props.hint ? (
        <p class="field-message" id="password-hint">
          {props.hint}
        </p>
      ) : null}
    </div>
  )
}
