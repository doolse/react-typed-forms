import Highlight, { defaultProps } from "prism-react-renderer";
import theme from "prism-react-renderer/themes/github";
// @ts-ignore
import Prism from "prism-react-renderer/prism";

export default function CodeBlock({ code }: { code: string }) {
  return (
    <div>
      <Highlight
        {...defaultProps}
        language="jsx"
        theme={theme}
        Prism={Prism}
        code={code}
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
      <button onClick={openSandbox}>Open sandbox</button>
    </div>
  );

  async function openSandbox() {
    const response = await fetch(
      "https://codesandbox.io/api/v1/sandboxes/define?json=1",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          files: {
            "package.json": {
              content: {
                dependencies: {
                  "@react-typed-forms/core": "latest",
                  next: "latest",
                  react: "latest",
                  "react-dom": "latest",
                },
                devDependencies: {
                  typescript: "4.6.3",
                  "@types/react": "latest",
                  "@types/node": "latest",
                },
                scripts: {
                  start: "next dev",
                },
              },
            },
            "pages/index.tsx": {
              content: code,
            },
          },
        }),
      }
    );
    const { sandbox_id } = await response.json();
    document.location.href =
      "https://codesandbox.io/s/" + sandbox_id + "?file=/pages/index.tsx";
  }
}
