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
        <header className="bg-white bg-opacity-50 fixed w-full h-12 border-b-2 backdrop-blur-md">
          <div className="max-w-5xl mx-auto w-full h-full flex">
            <a href="/" className=" h-full px-4 flex items-center">
              <strong className="text-primary text-2xl tracking-tighter">
                SCLOG
              </strong>
            </a>
            <nav className="mx-auto text-center flex items-center">
              이 공간에 뭘 할까
            </nav>
          </div>
        </header>
        <main className="pt-12">{children}</main>
        <footer className="bg-white w-full border-t-2">
          <div className="gap-4 flex flex-col py-4 w-full mx-auto max-w-5xl">
            <div className="flex gap-2 items-center">
              <a href="https://github.com/scwon" className="" target="_blank">
                <span className="text-gray-400 text-md tracking-tighter">
                  GITHUB
                </span>
              </a>
              <div className="border-r-2 h-4 border-gray-200" />
              <a
                href="https://www.linkedin.com/in/%EC%84%B1%EC%B2%A0-%EC%9B%90-b9837821b"
                className=""
                target="_blank"
              >
                <span className="text-gray-400 px-2 text-md tracking-tighter">
                  LINKEDIN
                </span>
              </a>
              <div className="border-r-2 h-4 border-gray-200" />
              <a
                href="https://www.instagram.com/zeushera00/"
                className=""
                target="_blank"
              >
                <span className="text-gray-400 px-2 text-md tracking-tighter">
                  INSTAGRAM
                </span>
              </a>
            </div>
            <a href="/" className="">
              <strong className="text-primary text-4xl tracking-tighter">
                SCLOG
              </strong>
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
