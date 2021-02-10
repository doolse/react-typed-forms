import { AppProps } from "next/app";
import React, { Fragment } from "react";
import Link from "next/link";
import Head from "next/head";

const examples: [string, string][] = [
  ["/simple", "Simple"],
  ["/basic", "Basic"],
  ["/arrays", "Arrays"],
  ["/validation", "Validation"],
];
export default function FormApp({ Component, pageProps }: AppProps) {
  return (
    <div>
      <Head>
        <title>Examples</title>
        <link
          rel="stylesheet"
          href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css"
        />
      </Head>
      <div className="m-2">
        {examples.map(([to, text], idx) => (
          <Fragment key={idx}>
            {idx > 0 && " | "} <Link href={to}>{text}</Link>
          </Fragment>
        ))}
      </div>
      <Component {...pageProps} />
    </div>
  );
}
