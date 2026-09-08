import twemoji from '@twemoji/api'

const options = {
  base: 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@17.0.3/assets/',
  className: 'twemoji',
  ext: '.svg',
  folder: 'svg',
}

export function installGlobalTwemoji(root: HTMLElement): () => void {
  const parse = (node: Node) => {
    if (node instanceof HTMLElement) twemoji.parse(node, options)
    else if (node.parentElement) twemoji.parse(node.parentElement, options)
  }

  twemoji.parse(root, options)
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) parse(node)
      if (mutation.type === 'characterData') parse(mutation.target)
    }
  })
  observer.observe(root, {
    characterData: true,
    childList: true,
    subtree: true,
  })
  return () => observer.disconnect()
}
