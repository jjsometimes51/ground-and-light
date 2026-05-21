import Link from 'next/link'

const nav = ['Travel', 'Notes', 'Work', 'Musings', 'About']

export default function Header({ variant = 'page', active }: { variant?: 'home' | 'page'; active?: string }) {
  const brandText = variant === 'home' ? 'Ground & Light' : active || 'Ground & Light'

  return (
    <header className={`container header ${variant === 'home' ? 'home-header' : 'page-header'}`}>
      <Link href="/" className="logo">
        <img src="/logo-mark.png" alt="" className="logo-mark" />
        <span className="logo-text">{brandText}</span>
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
