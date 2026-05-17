import Link from 'next/link'

const nav = ['Travel', 'Notes', 'Work', 'Musings', 'About']

export default function Header() {
  return (
    <header className="container header">
      <Link href="/" className="logo">
        <img src="/logo.png" alt="Ground & Light" className="logo-full" />
      </Link>
      <nav className="nav">
        {nav.map(item => (
          <Link key={item} href={item === 'About' ? '/about' : `/${item.toLowerCase()}`}>{item}</Link>
        ))}
      </nav>
    </header>
  )
}
