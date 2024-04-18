import { PageContainer } from "@/layouts";
import Image from "next/image";

export default function Home() {
  return (
    <PageContainer>
      <section className="pb-8 border-b-2">
        <div className="flex">
          <div className="flex flex-col items-center gap-4 w-40">
            <div className="rounded-full w-fit overflow-hidden">
              <Image src={"/me.jpeg"} alt="profile" width={100} height={100} />
            </div>
            <div className="">
              <strong className="mr-2">원성철</strong>
              <span className="text-sm leading-none text-gray-500 inline-block">
                FE Developer
              </span>
            </div>
          </div>
          <div className="flex-1 p-4 text-center flex flex-col justify-center gap-4">
            <h1 className="text-xl">&quot;프론트엔드 개발자 원성철&quot;</h1>
            <h1 className="text-xl">
              &quot;블로그에 당도한 것을 환영하네&quot;
            </h1>
            <h1 className="text-xl">
              &quot;자기소개 멘트가 떨어졌네 반 갑 네&quot;
            </h1>
          </div>
        </div>
      </section>
      <section className="py-8">여기부터 최신 게시글 들어갈듯?</section>
    </PageContainer>
  );
}
