import { ESLintUtils } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(() => null);

const rule = createRule({
  name: 'example-single-child',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require <Example> to wrap exactly one direct child element',
      recommended: 'error',
    },
    schema: [],
    messages: {
      requiresChild: '<Example> must wrap exactly one direct child element.',
      singleChildOnly:
        '<Example> must wrap exactly one direct child element, but {{ count }} were provided.',
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      JSXElement(node) {
        if (!isExampleComponent(node)) {
          return;
        }

        const meaningfulChildren = node.children.filter(isMeaningfulChild);

        if (meaningfulChildren.length === 0) {
          context.report({
            node,
            messageId: 'requiresChild',
          });
          return;
        }

        if (meaningfulChildren.length > 1) {
          context.report({
            node,
            messageId: 'singleChildOnly',
            data: {
              count: meaningfulChildren.length,
            },
          });
        }
      },
    };
  },
});

function isExampleComponent(node) {
  const nameNode = node.openingElement.name;
  return nameNode.type === 'JSXIdentifier' && nameNode.name === 'Example';
}

function isMeaningfulChild(child) {
  if (child.type === 'JSXText') {
    return child.value.trim().length > 0;
  }

  if (child.type === 'JSXExpressionContainer') {
    return isMeaningfulExpression(child.expression);
  }

  if (child.type === 'JSXFragment') {
    // Fragments count as a single child even though they can contain many nodes.
    return true;
  }

  return true;
}

function isMeaningfulExpression(expression) {
  if (expression.type === 'JSXEmptyExpression') {
    return false;
  }

  if (expression.type === 'Literal') {
    if (typeof expression.value === 'string') {
      return expression.value.trim().length > 0;
    }

    return expression.value !== null && expression.value !== false;
  }

  return true;
}

export default rule;

