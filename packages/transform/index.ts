import {
  types as BabelTypes,
  template as BabelTemplate,
  PluginObj,
  PluginPass,
  NodePath,
  template,
} from "@babel/core";
import { isModule, addNamed } from "@babel/helper-module-imports";
import { minimatch } from 'minimatch';

// TODO:
// - how to trigger rerenders on attributes change if transform never sees
//   `.value`?

interface PluginArgs {
  types: typeof BabelTypes;
  template: typeof BabelTemplate;
}

const optOutCommentIdentifier = /(^|\s)@noTrackControls(\s|$)/;
const optInCommentIdentifier = /(^|\s)@trackControls(\s|$)/;
const dataNamespace = "@react-typed-forms/transform";
const defaultImportSource = "@react-typed-forms/core";
const importName = "useComponentTracking";
const getHookIdentifier = "getHookIdentifier";
const maybeUsesSignal = "maybeUsesSignal";
const containsJSX = "containsJSX";
const alreadyTransformed = "alreadyTransformed";
const dontTransformId = "dontTransform";

const get = (pass: PluginPass, name: any) =>
  pass.get(`${dataNamespace}/${name}`);
const set = (pass: PluginPass, name: string, v: any) =>
  pass.set(`${dataNamespace}/${name}`, v);

interface DataContainer {
  getData(name: string): any;
  setData(name: string, value: any): void;
}
const setData = (node: DataContainer, name: string, value: any) =>
  node.setData(`${dataNamespace}/${name}`, value);
const getData = (node: DataContainer, name: string) =>
  node.getData(`${dataNamespace}/${name}`);

function setOnFunctionScope(path: NodePath, key: string, value: any) {
  const functionScope = path.scope.getFunctionParent();
  if (functionScope) {
    setData(functionScope, key, value);
  }
}

type FunctionLike =
  | BabelTypes.ArrowFunctionExpression
  | BabelTypes.FunctionExpression
  | BabelTypes.FunctionDeclaration;

function testFunctionName<T extends FunctionLike>(
  predicate: (name: string | null) => boolean
): (path: NodePath<T>) => boolean {
  return (path: NodePath<T>) => {
    if (
      path.node.type === "ArrowFunctionExpression" ||
      path.node.type === "FunctionExpression"
    ) {
      return (
        path.parentPath.node.type === "VariableDeclarator" &&
        path.parentPath.node.id.type === "Identifier" &&
        predicate(path.parentPath.node.id.name)
      );
    } else if (path.node.type === "FunctionDeclaration") {
      return predicate(path.node.id?.name ?? null);
    } else {
      return false;
    }
  };
}

const fnNameStartsWithCapital = testFunctionName(
  (name) => name?.match(/^[A-Z]/) !== null
);
const fnNameStartsWithUse = testFunctionName(
  (name) => name?.match(/^use[A-Z]/) !== null
);

function hasLeadingComment(path: NodePath, comment: RegExp): boolean {
  const comments = path.node.leadingComments;
  return comments?.some((c) => c.value.match(comment) !== null) ?? false;
}

function hasLeadingOptInComment(path: NodePath) {
  return hasLeadingComment(path, optInCommentIdentifier);
}

function hasLeadingOptOutComment(path: NodePath) {
  return hasLeadingComment(path, optOutCommentIdentifier);
}

function isOptedIntoSignalTracking(path: NodePath | null): boolean {
  if (!path) return false;

  switch (path.node.type) {
    case "ArrowFunctionExpression":
    case "FunctionExpression":
    case "FunctionDeclaration":
    case "VariableDeclarator":
    case "VariableDeclaration":
    case "AssignmentExpression":
      return (
        hasLeadingOptInComment(path) ||
        isOptedIntoSignalTracking(path.parentPath)
      );
    case "ExportDefaultDeclaration":
    case "ExportNamedDeclaration":
    case "ObjectProperty":
    case "ExpressionStatement":
      return hasLeadingOptInComment(path);
    default:
      return false;
  }
}

function isOptedOutOfSignalTracking(path: NodePath | null): boolean {
  if (!path) return false;

  switch (path.node.type) {
    case "ArrowFunctionExpression":
    case "FunctionExpression":
    case "FunctionDeclaration":
    case "VariableDeclarator":
    case "VariableDeclaration":
    case "AssignmentExpression":
      return (
        hasLeadingOptOutComment(path) ||
        isOptedOutOfSignalTracking(path.parentPath)
      );
    case "ExportDefaultDeclaration":
    case "ExportNamedDeclaration":
    case "ObjectProperty":
    case "ExpressionStatement":
      return hasLeadingOptOutComment(path);
    default:
      return false;
  }
}

function isComponentFunction(path: NodePath<FunctionLike>): boolean {
  return (
    fnNameStartsWithCapital(path) && // Function name indicates it's a component
    getData(path.scope, containsJSX) === true && // Function contains JSX
    path.scope.parent === path.scope.getProgramParent() // Function is top-level
  );
}
function shouldTransform(
  path: NodePath<FunctionLike>,
  options: PluginOptions,
  state: PluginPass
): boolean {
  if (get(state, dontTransformId))
    return false;
  if (getData(path, alreadyTransformed) === true) return false;

  // Opt-out takes first precedence
  if (isOptedOutOfSignalTracking(path)) return false;
  // Opt-in opts in to transformation regardless of mode
  if (isOptedIntoSignalTracking(path)) return true;

  if (options.mode === "all") {
    return isComponentFunction(path);
  }

  if (options.mode == null || options.mode === "auto") {
    return isComponentFunction(path);
  }

  return false;
}

function isValueMemberExpression(
  path: NodePath<BabelTypes.MemberExpression>
): boolean {
  return (
    (path.node.property.type === "Identifier" &&
      path.node.property.name === "value") ||
    (path.node.property.type === "StringLiteral" &&
      path.node.property.value === "value")
  );
}

const tryCatchTemplate = template.statements`var STORE_IDENTIFIER = HOOK_IDENTIFIER();
try {
	BODY
} finally {
	STORE_IDENTIFIER();
}`;

function wrapInTryFinally(
  t: typeof BabelTypes,
  path: NodePath<FunctionLike>,
  state: PluginPass
): FunctionLike {
  const stopTrackingIdentifier = path.scope.generateUidIdentifier("effect");

  const newFunction = t.cloneNode(path.node);
  newFunction.body = t.blockStatement(
    tryCatchTemplate({
      STORE_IDENTIFIER: stopTrackingIdentifier,
      HOOK_IDENTIFIER: get(state, getHookIdentifier)(),
      BODY: t.isBlockStatement(path.node.body)
        ? path.node.body.body // TODO: Is it okay to elide the block statement here?
        : t.returnStatement(path.node.body),
    })
  );

  return newFunction;
}

function transformFunction(
  t: typeof BabelTypes,
  options: PluginOptions,
  path: NodePath<FunctionLike>,
  state: PluginPass
) {
  if (options.debug) {
    testFunctionName((n) => (console.info(`Transforming ${n}`), true))(path);
  }

  let newFunction: FunctionLike = wrapInTryFinally(t, path, state);

  // Using replaceWith keeps the existing leading comments already so
  // we'll clear our cloned node's leading comments to ensure they
  // aren't duplicated in the output.
  newFunction.leadingComments = [];

  setData(path, alreadyTransformed, true);
  path.replaceWith(newFunction);
}

function createImportLazily(
  types: typeof BabelTypes,
  pass: PluginPass,
  path: NodePath<BabelTypes.Program>,
  importName: string,
  source: string
): () => BabelTypes.Identifier {
  return () => {
    if (!isModule(path)) {
      throw new Error(
        `Cannot import ${importName} outside of an ESM module file.`
      );
    }

    let reference: BabelTypes.Identifier = get(pass, `imports/${importName}`);
    if (reference) return types.cloneNode(reference);
    reference = addNamed(path, importName, source, {
      importedInterop: "uncompiled",
      importPosition: "after",
    });
    set(pass, `imports/${importName}`, reference);

    /** Helper function to determine if an import declaration's specifier matches the given importName  */
    const matchesImportName = (
      s: BabelTypes.ImportDeclaration["specifiers"][0]
    ) => {
      if (s.type !== "ImportSpecifier") return false;
      return (
        (s.imported.type === "Identifier" && s.imported.name === importName) ||
        (s.imported.type === "StringLiteral" && s.imported.value === importName)
      );
    };

    for (let statement of path.get("body")) {
      if (
        statement.isImportDeclaration() &&
        statement.node.source.value === source &&
        statement.node.specifiers.some(matchesImportName)
      ) {
        path.scope.registerDeclaration(statement);
        break;
      }
    }

    return reference;
  };
}

export interface PluginOptions {
  /**
   * Specify the mode to use:
   * - `auto`: Automatically wrap all components that use signals.
   * - `manual`: Only wrap components that are annotated with `@trackSignals` in a JSX comment.
   * - `all`: Makes all components reactive to signals.
   */
  mode?: "auto" | "manual" | "all";
  debug?: boolean;
  /** Specify a custom package to import the `useSignals` hook from. */
  importSource?: string;
  experimental?: {
    /**
     * If set to true, the component body will not be wrapped in a try/finally
     * block and instead the next component render or a microtick will stop
     * tracking signals for this component. This is an experimental feature and
     * may be removed in the future.
     * @default false
     */
    noTryFinally?: boolean;
  };
  // ... existing options ...
  include?: string[];
  exclude?: string[];
}

export default function signalsTransform(
  { types: t }: PluginArgs,
  options: PluginOptions
): PluginObj {
  // Helper function to check if file should be processed
  function shouldProcessFile(filename: string): boolean {
    if (!filename) return true;
    
    // If no include/exclude patterns are specified, process all files
    if (!options.include && !options.exclude) return true;

    // Check exclude patterns first
    if (options.exclude) {
      for (const pattern of options.exclude) {
        if (minimatch(filename, pattern)) {
          return false;
        }
      }
    }

    // If include patterns exist, file must match at least one
    if (options.include) {
      return options.include.some(pattern => minimatch(filename, pattern));
    }

    return true;
  }

  return {
    name: dataNamespace,
    visitor: {
      Program: {
        enter(path, state) {
          // Following the pattern of babel-plugin-transform-react-jsx, we
          // lazily create the import statement for the useSignalTracking hook.
          // We create a function and store it in the PluginPass object, so that
          // on the first usage of the hook, we can create the import statement.
          set(state, dontTransformId, !shouldProcessFile(state.filename) || !isModule(path));
          set(
            state,
            getHookIdentifier,
            createImportLazily(
              t,
              state,
              path,
              importName,
              options.importSource ?? defaultImportSource
            )
          );
        },
      },
      ArrowFunctionExpression: {
        // TODO: Consider alternate implementation, where on enter of a function
        // expression, we run our own manual scan the AST to determine if the
        // function uses signals and is a component. This manual scan once upon
        // seeing a function would probably be faster than running an entire
        // babel pass with plugins on components twice.
        exit(path, state) {
          if (shouldTransform(path, options, state)) {
            transformFunction(t, options, path, state);
          }
        },
      },

      FunctionExpression: {
        exit(path, state) {
          if (shouldTransform(path, options, state)) {
            transformFunction(t, options, path, state);
          }
        },
      },

      FunctionDeclaration: {
        exit(path, state) {
          if (shouldTransform(path, options, state)) {
            transformFunction(t, options, path, state);
          }
        },
      },

      MemberExpression(path) {
        if (isValueMemberExpression(path)) {
          setOnFunctionScope(path, maybeUsesSignal, true);
        }
      },

      JSXElement(path) {
        setOnFunctionScope(path, containsJSX, true);
      },
      JSXFragment(path) {
        setOnFunctionScope(path, containsJSX, true);
      },
    },
  };
}