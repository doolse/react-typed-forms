import React from "react";
import { render } from "react-dom";
import { BasicFormExample } from "./basic";
import { ArraysExample } from "./arrays";
import { BrowserRouter, Link, Route } from "react-router-dom";
render(
  <BrowserRouter>
    <div>
      <Link to="/basic">Basic Example</Link>
      <Link to="/arrays">Arrays Example</Link>
    </div>
    <Route path="/basic" component={BasicFormExample} />
    <Route path="/arrays" component={ArraysExample} />
  </BrowserRouter>,
  document.getElementById("main")
);
