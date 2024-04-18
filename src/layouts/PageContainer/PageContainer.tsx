import { PropsWithChildren } from "react";

const PageContainer = (props: PropsWithChildren) => {
  return <div className="w-full mx-auto max-w-5xl py-8">{props.children}</div>;
};

export default PageContainer;
