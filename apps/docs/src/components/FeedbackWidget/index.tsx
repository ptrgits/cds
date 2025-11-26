import React, { useCallback, useState } from 'react';
import { Button } from '@coinbase/cds-web/buttons';
import { ControlGroup, Radio, TextInput } from '@coinbase/cds-web/controls';
import { NativeTextArea } from '@coinbase/cds-web/controls/NativeTextArea';
import { HStack, VStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography/Text';
import { useLocation } from '@docusaurus/router';
import { useAnalytics } from '@site/src/utils/useAnalytics';

type FeedbackType = 'positive' | 'negative' | null;
type FeedbackCategory = string | null;

type FeedbackOption = {
  value: string;
  label: string;
  command: string;
};

const POSITIVE_OPTIONS: FeedbackOption[] = [
  {
    value: 'clear',
    label: 'Clear explanations and easy to follow',
    command: 'positive_clear',
  },
  {
    value: 'examples',
    label: 'Good code examples',
    command: 'positive_examples',
  },
  {
    value: 'api_docs',
    label: 'Complete props/API documentation',
    command: 'positive_api_docs',
  },
  {
    value: 'visuals',
    label: 'Helpful visual examples or demos',
    command: 'positive_visuals',
  },
  {
    value: 'other',
    label: 'Something else',
    command: 'positive_other',
  },
];

const NEGATIVE_OPTIONS: FeedbackOption[] = [
  {
    value: 'confusing',
    label: 'Explanation is confusing or unclear',
    command: 'negative_confusing',
  },
  {
    value: 'examples',
    label: "Code examples are missing or don't work",
    command: 'negative_examples',
  },
  {
    value: 'incomplete_api',
    label: 'Props/API documentation is incomplete',
    command: 'negative_incomplete_api',
  },
  {
    value: 'missing_info',
    label: 'Missing information or use cases',
    command: 'negative_missing_info',
  },
  {
    value: 'bug',
    label: 'Found a bug (typo, broken link, visual issue)',
    command: 'negative_bug',
  },
  {
    value: 'other',
    label: 'Something else',
    command: 'negative_other',
  },
];

export function FeedbackWidget() {
  const [feedback, setFeedback] = useState<FeedbackType>(null);
  const [category, setCategory] = useState<FeedbackCategory>(null);
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const location = useLocation();

  const { trackGtagEvent, postMetric } = useAnalytics();

  // Callback ref to focus the confirmation message when it's rendered
  const confirmationRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      node.focus();
    }
  }, []);

  // Callback ref to focus the category selection when it's rendered
  const categorySelectionRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      node.focus();
    }
  }, []);

  const handleYesNoClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      try {
        // Get the feedback type from the data attribute
        const type = event.currentTarget.dataset.feedbackType as FeedbackType;

        if (feedback === type) return;
        setFeedback(type);

        trackGtagEvent({
          action: 'doc_feedback',
          category: 'Documentation',
          label: location.pathname,
          value: type === 'positive' ? 1 : -1,
        });
        postMetric('cdsDocs', {
          command: 'feedback',
          arguments: type ?? 'unknown',
          context: location.pathname,
        });
      } catch (error) {
        // Log the error but don't disrupt the user experience
        console.error('Error handling feedback:', error);
      }
    },
    [feedback, location.pathname, trackGtagEvent, postMetric],
  );

  const handleCategoryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setCategory(e.target.value),
    [],
  );

  const handleAdditionalDetailsChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => setAdditionalDetails(event.target.value),
    [],
  );

  const handleSubmit = useCallback(() => {
    try {
      if (!category || !feedback) {
        return;
      }

      const options = feedback === 'positive' ? POSITIVE_OPTIONS : NEGATIVE_OPTIONS;
      const selectedOption = options.find((opt) => opt.value === category);

      if (!selectedOption) return;

      trackGtagEvent({
        action: selectedOption.command,
        category: 'Documentation',
        label: additionalDetails.trim() || undefined,
      });

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  }, [category, feedback, additionalDetails, trackGtagEvent]);

  const handleSkip = useCallback(() => {
    // Still submit if we have a category
    if (category) handleSubmit();
    setSubmitted(true);
  }, [category, handleSubmit]);

  const canSubmit = category;

  // Don't show feedback widget on home page
  const isHomePage = location.pathname === '/' || location.pathname === '/index.html';
  if (isHomePage) return;

  return (
    <div key={location.pathname}>
      {submitted ? (
        <VStack
          ref={confirmationRef}
          background="bgAlternate"
          borderRadius={500}
          gap={3}
          padding={4}
          tabIndex={-1}
        >
          <Text font="title3">Thank you for your feedback!</Text>
        </VStack>
      ) : feedback !== null ? (
        <VStack
          ref={categorySelectionRef}
          aria-labelledby="feedback-category-heading"
          background="bgAlternate"
          borderRadius={500}
          gap={3}
          padding={4}
          role="region"
          tabIndex={-1}
        >
          <ControlGroup
            ControlComponent={Radio}
            label={
              <Text as="h3" font="title3" id="feedback-category-heading">
                {feedback === 'positive'
                  ? 'Great! What worked best for you?'
                  : 'How can we improve our product?'}
              </Text>
            }
            onChange={handleCategoryChange}
            options={feedback === 'positive' ? POSITIVE_OPTIONS : NEGATIVE_OPTIONS}
            role="radiogroup"
            value={category ?? ''}
          />
          <TextInput
            inputNode={
              <NativeTextArea
                onChange={handleAdditionalDetailsChange}
                rows={5}
                style={{ resize: 'none' }}
                value={additionalDetails}
              />
            }
            label="Please tell us more"
          />
          <HStack gap={2}>
            <Button compact disabled={!canSubmit} onClick={handleSubmit} variant="secondary">
              Submit Feedback
            </Button>
            <Button compact transparent onClick={handleSkip} variant="secondary">
              Skip
            </Button>
          </HStack>
        </VStack>
      ) : (
        <VStack
          aria-labelledby="feedback-heading"
          background="bgAlternate"
          borderRadius={500}
          gap={{ base: 3, phone: 1 }}
          padding={{ base: 4, phone: 2 }}
          role="region"
        >
          <Text as="h3" font="title3" id="feedback-heading">
            Was this page helpful?
          </Text>
          <HStack aria-label="Page feedback options" gap={2} role="group">
            <Button
              compact
              startIconActive
              accessibilityLabel="Yes, this page is helpful"
              data-feedback-type="positive"
              onClick={handleYesNoClick}
              startIcon="thumbsUp"
              variant="secondary"
            >
              Yes
            </Button>
            <Button
              compact
              startIconActive
              accessibilityLabel="No, this page is not helpful"
              data-feedback-type="negative"
              onClick={handleYesNoClick}
              startIcon="thumbsDown"
              variant="secondary"
            >
              No
            </Button>
          </HStack>
        </VStack>
      )}
    </div>
  );
}
