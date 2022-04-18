import Highlight, { defaultProps } from "prism-react-renderer";
import theme from "prism-react-renderer/themes/github";
// @ts-ignore
import Prism from "prism-react-renderer/prism";

export default function CodeBlock(props: { code: string }) {
  return (
    <Highlight
      {...defaultProps}
      language="jsx"
      theme={theme}
      Prism={Prism}
      code={props.code}
    >
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre className={className} style={{ ...style, padding: "20px" }}>
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line, key: i })}>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token, key })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
}
