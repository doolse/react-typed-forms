import React, { FC, Fragment } from "react";
import { render } from "react-dom";
import { BasicFormExample } from "./basic";
import { ArraysExample } from "./arrays";
import { BrowserRouter, Link, Route } from "react-router-dom";
import { ValidationExample } from "./validation";

const examples: [string, FC, string][] = [
  ["/basic", BasicFormExample, "Basic"],
  ["/arrays", ArraysExample, "Arrays"],
  ["/validation", ValidationExample, "Validation"],
];
render(
  <BrowserRouter>
    <div className="m-2">
      {examples.map(([to, _, text], idx) => (
        <Fragment key={idx}>
          {idx > 0 && " | "} <Link to={to}>{text}</Link>
        </Fragment>
      ))}
    </div>
    {examples.map(([path, component]) => (
      <Route key={path} path={path} component={component} />
    ))}
  </BrowserRouter>,
  document.getElementById("main")
);
