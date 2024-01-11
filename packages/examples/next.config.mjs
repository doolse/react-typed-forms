import mdx from "@next/mdx";

const withMDX = mdx({
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
});

/** @type {import('next').NextConfig} */
const config = {
  pageExtensions: ["tsx", "mdx", "ts"],
  basePath: "/react-typed-forms",
  reactStrictMode: false,
  output: "export"
};

export default withMDX(config);
