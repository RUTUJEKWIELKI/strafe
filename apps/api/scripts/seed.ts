import { eq } from 'drizzle-orm'
import { randomBytes } from 'node:crypto'
import { hash, argon2id } from 'argon2'

import {
  channels,
  roles,
  serverMembers,
  serverRoles,
  servers,
  userProfiles,
  userSettings,
  users,
  authIdentities
} from './src/db/schema/index.js'
import { createId } from './src/lib/ids.js'
import { db } from './src/db/connection.js' // We'll assume a standard Drizzle connection

async function seed() {
  console.log('🌱 Starting database seeding...')

  // 1. Create a super admin user
  const adminId = createId()
  const passwordHash = await hash('strafe_admin_password', {
    hashLength: 32,
    memoryCost: 19_456,
    parallelism: 1,
    timeCost: 2,
    type: argon2id,
  })

  await db.insert(users).values({
    id: adminId,
    email: 'admin@strafe.app',
    handle: 'admin',
    normalizedHandle: 'admin',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    emailVerifiedAt: new Date()
  })

  await db.insert(userProfiles).values({
    userId: adminId,
    displayName: 'System Admin',
  })

  await db.insert(userSettings).values({
    userId: adminId,
  })

  await db.insert(authIdentities).values({
    id: createId(),
    userId: adminId,
    provider: 'local',
    providerSubject: 'admin@strafe.app',
    passwordHash,
  })
  
  console.log('✅ Created admin user (admin@strafe.app / strafe_admin_password)')

  // 2. Create an official Strafe Community server
  const serverId = createId()
  await db.insert(servers).values({
    id: serverId,
    name: 'Strafe Community',
    ownerId: adminId,
    visibility: 'public',
  })

  // 3. Create server roles (Owner, Moderator, Member)
  const ownerRoleId = createId()
  const modRoleId = createId()
  
  await db.insert(roles).values([
    {
      id: ownerRoleId,
      serverId,
      name: 'Owner',
      color: '#ff0000',
      position: 100,
      permissions: '8', // ALL
    },
    {
      id: modRoleId,
      serverId,
      name: 'Moderator',
      color: '#00ff00',
      position: 90,
      permissions: '6', // MANAGE_MESSAGES etc
    }
  ])

  // 4. Add admin to the server
  await db.insert(serverMembers).values({
    id: createId(),
    serverId,
    userId: adminId,
    state: 'active',
  })

  await db.insert(serverRoles).values({
    serverId,
    userId: adminId,
    roleId: ownerRoleId,
  })

  // 5. Create default channels
  await db.insert(channels).values([
    {
      id: createId(),
      serverId,
      name: 'general',
      type: 'text',
      positionKey: 'a',
    },
    {
      id: createId(),
      serverId,
      name: 'announcements',
      type: 'announcement',
      positionKey: 'b',
    },
    {
      id: createId(),
      serverId,
      name: 'Voice Lounge',
      type: 'voice',
      positionKey: 'c',
    }
  ])
  
  console.log('✅ Created "Strafe Community" server with channels and roles')
  console.log('🌱 Seeding complete!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err)
  process.exit(1)
})
