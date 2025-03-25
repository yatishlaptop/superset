import { MemoryRouter } from 'react-router-dom';
import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';
import * as reactRedux from 'react-redux';
import fetchMock from 'fetch-mock';
import { isFeatureEnabled } from '@superset-ui/core';
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from 'spec/helpers/testing-library';
import { QueryParamProvider } from 'use-query-params';

import PredictiveList from 'src/pages/PredictiveList';

jest.setTimeout(30000);

jest.mock('@superset-ui/core', () => ({
  ...jest.requireActual('@superset-ui/core'),
  isFeatureEnabled: jest.fn(),
}));

const mockPredictions = [...new Array(3)].map((_, i) => ({
  changed_on: new Date().toISOString(),
  creator: 'super user',
  id: i,
  model_name: `Predictive Model ${i}`,
  url: 'url',
  datasource_name: `ds${i}`,
  thumbnail_url: '/thumbnail',
}));

const mockUser = { userId: 1 };

const predictiveInfoEndpoint = 'glob:*/api/v1/predictive/_info*';
const predictiveOwnersEndpoint = 'glob:*/api/v1/predictive/related/owners*';
const predictiveCreatedByEndpoint = 'glob:*/api/v1/predictive/related/created_by*';
const predictiveEndpoint = 'glob:*/api/v1/predictive/*';
const datasetEndpoint = 'glob:*/api/v1/dataset/*';

fetchMock.get(predictiveInfoEndpoint, { permissions: ['can_read', 'can_write'] });
fetchMock.get(predictiveOwnersEndpoint, { result: [] });
fetchMock.get(predictiveCreatedByEndpoint, { result: [] });
fetchMock.get(predictiveEndpoint, { result: mockPredictions, count: 3 });
fetchMock.get(datasetEndpoint, {});

global.URL.createObjectURL = jest.fn();
fetchMock.get('/thumbnail', { body: new Blob(), sendAsJson: false });

const user = {
  createdOn: '2021-04-27T18:12:38.952304',
  email: 'admin',
  firstName: 'admin',
  isActive: true,
  lastName: 'admin',
  userId: 1,
  username: 'admin',
};

const mockStore = configureStore([thunk]);
const store = mockStore({ user });
const useSelectorMock = jest.spyOn(reactRedux, 'useSelector');

const renderPredictiveList = (props = {}) =>
  render(
    <MemoryRouter>
      <QueryParamProvider>
        <PredictiveList {...props} user={mockUser} />
      </QueryParamProvider>
    </MemoryRouter>,
    { useRedux: true, store },
  );

describe('PredictiveList', () => {
  beforeEach(() => {
    isFeatureEnabled.mockImplementation(
      feature => feature === 'LISTVIEWS_DEFAULT_CARD_VIEW',
    );
    fetchMock.resetHistory();
    useSelectorMock.mockClear();
  });

  afterAll(() => {
    isFeatureEnabled.mockRestore();
  });

  it('renders', async () => {
    renderPredictiveList();
    expect(await screen.findByText('Predictive Models')).toBeInTheDocument();
  });

  it('fetches data', async () => {
    renderPredictiveList();
    await waitFor(() => {
      const calls = fetchMock.calls(/predictive\/\?q/);
      expect(calls).toHaveLength(1);
    });
  });

  it('switches between card and table view', async () => {
    renderPredictiveList();
    await screen.findByTestId('predictive-list-view');

    const listViewToggle = await screen.findByRole('img', { name: 'unordered-list' });
    fireEvent.click(listViewToggle.closest('[role="button"]'));

    await waitFor(() => {
      expect(screen.getByRole('img', { name: 'unordered-list' }).closest('[role="button"]')).toHaveClass('active');
    });

    const cardViewToggle = screen.getByRole('img', { name: 'appstore' });
    fireEvent.click(cardViewToggle.closest('[role="button"]'));

    await waitFor(() => {
      expect(screen.getByRole('img', { name: 'appstore' }).closest('[role="button"]')).toHaveClass('active');
    });
  });

  it('shows edit modal', async () => {
    renderPredictiveList();
    await screen.findByTestId('predictive-list-view');

    const editButtons = await screen.findAllByTestId('edit-alt');
    fireEvent.click(editButtons[0]);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('renders an "Import Model" tooltip under import button', async () => {
    renderPredictiveList();
    const importButton = await screen.findByTestId('import-button');
    fireEvent.mouseEnter(importButton);

    const importTooltip = await screen.findByRole('tooltip', { name: 'Import predictive models' });
    expect(importTooltip).toBeInTheDocument();
  });
});
