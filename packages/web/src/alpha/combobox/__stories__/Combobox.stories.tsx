import { useCallback, useState } from 'react';

import { VStack } from '../../../layout/VStack';
import type { SelectOption } from '../../select/Select';
import { Combobox } from '../Combobox';

export default {
  title: 'Components/Alpha/Combobox',
  component: Combobox,
};

const exampleOptions: SelectOption[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'date', label: 'Date' },
  { value: 'elderberry', label: 'Elderberry' },
  { value: 'fig', label: 'Fig' },
  { value: 'grape', label: 'Grape' },
  { value: 'honeydew', label: 'Honeydew' },
  { value: 'kiwi', label: 'Kiwi' },
  { value: 'lemon', label: 'Lemon' },
  { value: 'mango', label: 'Mango' },
  { value: 'orange', label: 'Orange' },
  { value: 'papaya', label: 'Papaya' },
  { value: 'raspberry', label: 'Raspberry' },
  { value: 'strawberry', label: 'Strawberry' },
];

export const Default = () => {
  const [value, setValue] = useState<string[]>(['apple', 'banana']);

  const handleChange = useCallback((newValue: string | string[]) => {
    if (Array.isArray(newValue)) {
      setValue(newValue);
    } else {
      // Toggle the value
      setValue((prev) => {
        if (prev.includes(newValue)) {
          return prev.filter((v) => v !== newValue);
        }
        return [...prev, newValue];
      });
    }
  }, []);

  return (
    <VStack gap={4} width={400}>
      <Combobox
        label="Fruits"
        onChange={handleChange}
        options={exampleOptions}
        placeholder="Search fruits..."
        value={value}
      />
    </VStack>
  );
};

export const WithHelperText = () => {
  const [value, setValue] = useState<string[]>([]);

  const handleChange = useCallback((newValue: string | string[]) => {
    if (Array.isArray(newValue)) {
      setValue(newValue);
    } else {
      setValue((prev) => {
        if (prev.includes(newValue)) {
          return prev.filter((v) => v !== newValue);
        }
        return [...prev, newValue];
      });
    }
  }, []);

  return (
    <VStack gap={4} width={400}>
      <Combobox
        helperText="Select your favorite fruits"
        label="Fruit Selection"
        onChange={handleChange}
        options={exampleOptions}
        placeholder="Search fruits..."
        value={value}
      />
    </VStack>
  );
};

export const ControlledSearch = () => {
  const [value, setValue] = useState<string[]>(['apple']);
  const [searchText, setSearchText] = useState('');

  const handleChange = useCallback((newValue: string | string[]) => {
    if (Array.isArray(newValue)) {
      setValue(newValue);
    } else {
      setValue((prev) => {
        if (prev.includes(newValue)) {
          return prev.filter((v) => v !== newValue);
        }
        return [...prev, newValue];
      });
    }
  }, []);

  const handleSearch = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value);
  }, []);

  return (
    <VStack gap={4} width={400}>
      <Combobox
        label="Controlled Search"
        onChange={handleChange}
        onSearch={handleSearch}
        options={exampleOptions}
        placeholder="Type to search..."
        searchText={searchText}
        value={value}
      />
    </VStack>
  );
};

export const WithSelectAll = () => {
  const [value, setValue] = useState<string[]>([]);

  const handleChange = useCallback((newValue: string | string[]) => {
    if (Array.isArray(newValue)) {
      setValue(newValue);
    } else {
      setValue((prev) => {
        if (prev.includes(newValue)) {
          return prev.filter((v) => v !== newValue);
        }
        return [...prev, newValue];
      });
    }
  }, []);

  return (
    <VStack gap={4} width={400}>
      <Combobox
        label="Select All Example"
        onChange={handleChange}
        options={exampleOptions}
        placeholder="Search fruits..."
        selectAllLabel="Select All Fruits"
        value={value}
      />
    </VStack>
  );
};

export const MaxSelectedOptionsToShow = () => {
  const [value, setValue] = useState<string[]>(['apple', 'banana', 'cherry', 'date', 'elderberry']);

  const handleChange = useCallback((newValue: string | string[]) => {
    if (Array.isArray(newValue)) {
      setValue(newValue);
    } else {
      setValue((prev) => {
        if (prev.includes(newValue)) {
          return prev.filter((v) => v !== newValue);
        }
        return [...prev, newValue];
      });
    }
  }, []);

  return (
    <VStack gap={4} width={400}>
      <Combobox
        label="Max 3 Visible Chips"
        maxSelectedOptionsToShow={3}
        onChange={handleChange}
        options={exampleOptions}
        placeholder="Search fruits..."
        value={value}
      />
    </VStack>
  );
};
