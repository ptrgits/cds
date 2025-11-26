import { RuleTester } from '@typescript-eslint/rule-tester';

import rule from './index.mjs';

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
});

describe("'example-single-child' rule", () => {
  ruleTester.run('example-single-child', rule, {
    valid: [
      {
        code: `
          const ExampleStories = () => (
            <ExampleScreen>
              <Example title="Stack">
                <VStack>
                  <Text>Row 1</Text>
                  <Text>Row 2</Text>
                </VStack>
              </Example>
            </ExampleScreen>
          );

          export default ExampleStories;
        `,
        filename: 'Valid.stories.tsx',
      },
      {
        code: `
          const ExampleStories = () => (
            <ExampleScreen>
              <Example title="Fragment">
                <>
                  <Text>Row 1</Text>
                  <Text>Row 2</Text>
                </>
              </Example>
            </ExampleScreen>
          );

          export default ExampleStories;
        `,
        filename: 'Fragment.stories.tsx',
      },
    ],
    invalid: [
      {
        code: `
          const ExampleStories = () => (
            <ExampleScreen>
              <Example title="Missing child">
              </Example>
            </ExampleScreen>
          );

          export default ExampleStories;
        `,
        filename: 'MissingChild.stories.tsx',
        errors: [{ messageId: 'requiresChild' }],
      },
      {
        code: `
          const ExampleStories = () => (
            <ExampleScreen>
              <Example title="Two children">
                <Text>First</Text>
                <Text>Second</Text>
              </Example>
            </ExampleScreen>
          );

          export default ExampleStories;
        `,
        filename: 'TwoChildren.stories.tsx',
        errors: [{ messageId: 'singleChildOnly', data: { count: 2 } }],
      },
      {
        code: `
          const ExampleStories = () => (
            <ExampleScreen>
              <Example title="Text and child">
                Some text
                <Text>Child</Text>
              </Example>
            </ExampleScreen>
          );

          export default ExampleStories;
        `,
        filename: 'TextAndChild.stories.tsx',
        errors: [{ messageId: 'singleChildOnly', data: { count: 2 } }],
      },
    ],
  });
});

