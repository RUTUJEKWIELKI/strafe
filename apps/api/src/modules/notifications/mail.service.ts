import type { FastifyInstance } from 'fastify'
import nodemailer, { type Transporter } from 'nodemailer'

type ChallengeType = 'email_change' | 'email_verification' | 'password_reset'

const subjects: Record<ChallengeType, string> = {
  email_change: 'Potwierdź nowy adres e-mail Strafe',
  email_verification: 'Zweryfikuj adres e-mail Strafe',
  password_reset: 'Zresetuj hasło Strafe',
}

const paths: Record<ChallengeType, string> = {
  email_change: '/account/email/confirm',
  email_verification: '/account/email/verify',
  password_reset: '/auth/password/reset',
}

export class MailService {
  readonly #app: FastifyInstance
  readonly #transporter: Transporter | null

  constructor(app: FastifyInstance) {
    this.#app = app
    this.#transporter = app.config.SMTP_HOST
      ? nodemailer.createTransport({
          host: app.config.SMTP_HOST,
          port: app.config.SMTP_PORT,
          secure: app.config.SMTP_SECURE,
          ...(app.config.SMTP_USERNAME
            ? {
                auth: {
                  pass: app.config.SMTP_PASSWORD ?? '',
                  user: app.config.SMTP_USERNAME,
                },
              }
            : {}),
        })
      : null
  }

  get configured(): boolean {
    return this.#transporter !== null && Boolean(this.#app.config.SMTP_FROM)
  }

  async sendChallenge(
    type: ChallengeType,
    email: string,
    token: string,
  ): Promise<boolean> {
    if (!this.#transporter || !this.#app.config.SMTP_FROM) return false
    const url = new URL(paths[type], this.#app.config.APP_PUBLIC_URL)
    url.searchParams.set('token', token)
    const href = url.toString()
    await this.#transporter.sendMail({
      from: this.#app.config.SMTP_FROM,
      html: `<p>Użyj poniższego bezpiecznego odnośnika, aby dokończyć operację.</p><p><a href="${href}">${href}</a></p><p>Odnośnik jest jednorazowy i szybko wygasa.</p>`,
      subject: subjects[type],
      text: `Dokończ operację Strafe: ${href}\nOdnośnik jest jednorazowy i szybko wygasa.`,
      to: email,
    })
    return true
  }

  async sendNotification(
    email: string,
    subject: string,
    text: string,
  ): Promise<boolean> {
    if (!this.#transporter || !this.#app.config.SMTP_FROM) return false
    await this.#transporter.sendMail({
      from: this.#app.config.SMTP_FROM,
      subject,
      text,
      to: email,
    })
    return true
  }
}
