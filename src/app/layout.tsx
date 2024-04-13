import type { Metadata } from "next";
import "./globals.css";

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
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <header className="bg-white bg-opacity-50 fixed w-full flex h-12 border-b-2 backdrop-blur-md">
          <a href="/" className=" h-full px-4 flex items-center border-r-2">
            <strong className="text-primary text-2xl tracking-tighter">
              SCLOG
            </strong>
          </a>
          <nav className="mx-auto text-center flex items-center">
            이 공간에 뭘 할까
          </nav>
        </header>
        <main className="pt-12">{children}</main>
        <footer>푸터도 들어갈거임 아마도?</footer>
      </body>
    </html>
  );
}
