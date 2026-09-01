const threadTypes = new Set(['thread_public', 'thread_private'])
const threadParents = new Set(['announcement', 'forum', 'text'])

export function canUseChannelParent(
  childType: string,
  parentType: string,
): boolean {
  if (childType === 'category') return false
  if (threadTypes.has(childType)) return threadParents.has(parentType)
  return parentType === 'category'
}
