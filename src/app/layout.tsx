import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "sclog",
  description: "프론트엔드 개발자 원성철의 블로그.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <body className={inter.className}>
        <header>헤더 들어갈거임</header>
        {children}
        <footer>푸터도 들어갈거임 아마도?</footer>
      </body>
    </html>
  );
}
