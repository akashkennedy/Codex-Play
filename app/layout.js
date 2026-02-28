import './globals.css';

export const metadata = {
  title: 'Expense Tracker Pro',
  description: 'Minimal responsive expense tracker with dark mode and customizable UI.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
