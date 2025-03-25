import {
  FC,
  useMemo,
  useRef,
  useState,
} from 'react';

import Fuse from 'fuse.js';
import { t, styled, useTheme } from '@superset-ui/core';
import { Input } from 'src/components/Input';


interface ModelTypeGalleryProps {
  onChange: (vizType: string | null) => void;
  onDoubleClick: () => void;
  selectedViz: string | null;
  className?: string;
  denyList: string[];
}

type ModelEntry = {
  key: string;
  value: { name: string; thumbnail: string; description?: string };
};

const ModelPickerLayout = styled.div`
  display: flex;
  flex-direction: column;
  height: 70vh;
  overflow: auto;
`;

const SearchWrapper = styled.div`
  margin: 10px;
`;

const Thumbnail: FC<{
  entry: ModelEntry;
  selectedViz: string | null;
  setSelectedViz: (viz: string) => void;
  onDoubleClick: () => void;
}> = ({ entry, selectedViz, setSelectedViz, onDoubleClick }) => {
  const theme = useTheme();
  const isSelected = selectedViz === entry.key;

  return (
    <div
      role="button"
      css={{ cursor: 'pointer', border: isSelected ? `2px solid ${theme.colors.primary.light2}` : '1px solid gray' }}
      tabIndex={0}
      onClick={() => setSelectedViz(entry.key)}
      onDoubleClick={onDoubleClick}
    >
      <img alt={entry.value.name} src={entry.value.thumbnail} width="100%" />
      <div>{entry.value.name}</div>
    </div>
  );
};

const ModelTypeGallery: FC<ModelTypeGalleryProps> = ({ selectedViz, onChange, onDoubleClick, denyList, className }) => {
  const searchInputRef = useRef<HTMLInputElement>();
  const [searchInputValue, setSearchInputValue] = useState('');

  const modelMetadata: ModelEntry[] = useMemo(() => {
    return [
      { key: 'model1', value: { name: 'Model 1', thumbnail: '/path/to/img1.png' } },
      { key: 'model2', value: { name: 'Model 2', thumbnail: '/path/to/img2.png' } },
    ].filter(({ key }) => !denyList.includes(key));
  }, [denyList]);

  const fuse = useMemo(
    () => new Fuse(modelMetadata, { keys: ['value.name'], threshold: 0.3 }),
    [modelMetadata]
  );

  const searchResults = useMemo(
    () => (searchInputValue.trim() === '' ? [] : fuse.search(searchInputValue).map(result => result.item)),
    [searchInputValue, fuse]
  );

  return (
    <ModelPickerLayout className={className}>
      <SearchWrapper>
        <Input
          type="text"
          ref={searchInputRef as any}
          value={searchInputValue}
          placeholder={t('Search models')}
          onChange={e => setSearchInputValue(e.target.value)}
        />
      </SearchWrapper>
      <div>
        {(searchInputValue ? searchResults : modelMetadata).map(entry => (
          <Thumbnail
            key={entry.key}
            entry={entry}
            selectedViz={selectedViz}
            setSelectedViz={onChange}
            onDoubleClick={onDoubleClick}
          />
        ))}
      </div>
    </ModelPickerLayout>
  );
};

export default ModelTypeGallery;
