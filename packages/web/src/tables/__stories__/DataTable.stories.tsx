import type { Meta } from '@storybook/react';

import type { ColumnType } from '../DataTable';
import { Table } from '../Table';

export default {
  title: 'Components/Table/DataTable',
  component: Table,
} as Meta;

export const DataTableExample = () => {
  const data = [
    {
      key: '1',
      name: 'Mike',
      age: 32,
      address: '10 Downing Street',
    },
    {
      key: '2',
      name: 'John',
      age: 42,
      address: '10 Downing Street',
    },
  ];
  const columns = [
    {
      title: 'Name',
      key: 'name',
    },
    {
      title: 'Age',
      key: 'age',
    },
    {
      title: 'Address',
      key: 'address',
    },
  ] satisfies ColumnType[];
  return <Table columns={columns} data={data} />;
};
