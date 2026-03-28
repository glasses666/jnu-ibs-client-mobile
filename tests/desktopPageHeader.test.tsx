import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { DesktopPageHeader } from '../components/DesktopPageHeader.js';

test('DesktopPageHeader renders the active title, weather summary, and refresh label', () => {
  const html = renderToStaticMarkup(
    <DesktopPageHeader
      title="Dashboard"
      refreshLabel="Refresh"
      isLoading={true}
      weather={{
        place: 'Guangzhou',
        weather: 'Sunny',
        temperature: 28,
        wind: 'East 2',
        humidity: 60,
        code: 200,
      }}
      onRefresh={() => {}}
    />
  );

  assert.match(html, /Dashboard/);
  assert.match(html, /Refresh/);
  assert.match(html, /Guangzhou/);
  assert.match(html, /Sunny/);
  assert.match(html, /animate-spin/);
});
