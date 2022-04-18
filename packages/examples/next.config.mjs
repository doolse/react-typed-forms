import mdx from "@next/mdx";

const withMDX = mdx({
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
});
export default withMDX({
  pageExtensions: ["tsx", "mdx"],
  basePath: "/react-typed-forms"
});
