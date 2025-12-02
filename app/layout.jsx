import './globals.css'

export const metadata = {
  title: 'Облік виробництва | Production Accounting',
  description: 'Система обліку виробництва з маршрутними листами',
}

export default function RootLayout({ children }) {
  return (
    <html lang="uk">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
