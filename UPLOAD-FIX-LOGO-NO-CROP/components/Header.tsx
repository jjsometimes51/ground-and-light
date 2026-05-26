import Link from 'next/link'

const nav = ['Travel', 'Notes', 'Work', 'Musings', 'About']

export default function Header({ variant = 'page', active }: { variant?: 'home' | 'page'; active?: string }) {
  return (
    <header className={`container header ${variant === 'home' ? 'home-header' : 'page-header'}`}>
      <Link href="/" className="logo">
        <img src="/logo-header.png" alt="Ground & Light" className="logo-full" />
      </Link>
      <nav className="nav">
        {nav.map(item => (
          <Link
            key={item}
            href={item === 'About' ? '/about' : `/${item.toLowerCase()}`}
            className={active === item ? 'active' : undefined}
          >
            {item}
          </Link>
        ))}
      </nav>
    </header>
  )
}
