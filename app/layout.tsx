import '../styles/globals.css';

export const metadata = {
  title: '특허 명세서 자동 생성기',
  description: 'Claims → Spec Draft'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
