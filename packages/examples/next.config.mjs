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
  reactStrictMode: false
};

export default withMDX(config);
