import { type Metadata } from 'next';

import 'bootstrap/dist/css/bootstrap.min.css';

export const metadata: Metadata = {
  title: 'Gone Home-run Phone',
  description: 'Gone a home run with your phone',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
