# eslint-plugin-internal

This is a custom EsLint plugin for use within this repo only; it is not published.

For simplicity there is no build process since the repo root depends on this lib for its lint task. Otherwise, that vital task would be blocked while this project builds.

The plugin encapsulates the following rules:

### import-autofix

A fixable rule that applies Coinbase-opinionated styles to a modules import statements.
This rule copied from internal CB repositories during CDS's transition to open source.
Eventually, this rule could be moved to a new @coinbase open source package

### safely-spread-props

This rule checks that React component `...spread` props do not contain properties that the receiving component does not expect.
CDS components often compose together type interfaces from many other components. In some of those cases the component with the majority of the props usually receives its props with a `...spread`.
We have encounted situations where developers accidentally forgot to descture a prop intended for a different element and it ended up passed to the wrong component via the spread props.

At this time this rule is intended to only be used within this repo in the cds-web and cds-modile packages. However, after a trial period we may consider opening it up to a wider audience.

### example-screen-default

Ensures every Storybook file default-exports a component whose rendered output is rooted in `ExampleScreen`. This keeps documentation consistent and aligns with the patterns showcased in the mobile package.

### example-single-child

Requires that every `<Example>` component wraps exactly one direct child element. This is to help encourge examples to be lean and focused on a single idea at a time.
