import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

import { MemberService } from '../modules/members/member.service.js'

const memberServicePlugin: FastifyPluginAsync = async (app) => {
  app.decorate('memberService', new MemberService(app))
}

export default fp(memberServicePlugin, {
  dependencies: ['database'],
  name: 'member-service',
})
