import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { MotionDndTable, type MotionDndTableRow } from '../MotionDndTable';

const meta: Meta<typeof MotionDndTable> = {
  title: 'Tables/MotionDndTable (experimental)',
  component: MotionDndTable,
};

export default meta;
type Story = StoryObj<typeof MotionDndTable>;

const Demo = () => {
  const [rows] = React.useState<MotionDndTableRow[]>([
    { id: 'row-1', content: <div>Row One</div> },
    { id: 'row-2', content: <div>Row Two</div> },
    { id: 'row-3', content: <div>Row Three</div> },
    { id: 'row-4', content: <div>Row Four</div> },
  ]);

  const handleReorder = React.useCallback(
    (draggedId: string | number, overId: string | number | null) => {
      console.log('Dragged', draggedId, 'over', overId);
    },
    [],
  );

  return (
    <div style={{ maxWidth: 520 }}>
      <MotionDndTable onReorder={handleReorder} rows={rows} />
    </div>
  );
};

export const Basic: Story = {
  render: () => <Demo />,
};
