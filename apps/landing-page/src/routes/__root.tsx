import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Suwa — Your health. Your privacy. Always.' },
      { name: 'description', content: 'Private mental health care that puts your anonymity first.' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
    ],
  }),
  component: RootDocument,
})

function RootDocument() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
          <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
            <Link to="/" className="font-serif text-hero text-foreground no-underline">
              Suwa
            </Link>
            <div className="flex items-center gap-6">
              <Link to="/" className="text-sm text-foreground-secondary hover:text-foreground transition-colors no-underline">
                Home
              </Link>
              <Link to="/pricing" className="text-sm text-foreground-secondary hover:text-foreground transition-colors no-underline">
                Pricing
              </Link>
              <Link to="/contact" className="text-sm text-foreground-secondary hover:text-foreground transition-colors no-underline">
                Contact
              </Link>
            </div>
          </nav>
        </header>
        <main className="pt-16">
          <Outlet />
        </main>
        <Scripts />
      </body>
    </html>
  )
}
