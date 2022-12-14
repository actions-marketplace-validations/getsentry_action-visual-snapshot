import {promises as fs} from 'fs';
import path from 'path';
import * as io from '@actions/io';

import {diffSnapshots} from '@app/util/diffSnapshots';

const RESULTS_PATH = path.resolve(__dirname, '__results');

jest.mock('@actions/core', () => ({
  debug: jest.fn(),
  warning: jest.fn(),
}));

describe('diffSnapshots (integration)', function () {
  beforeEach(async () => {
    await io.mkdirP(RESULTS_PATH);
  });
  afterEach(async function () {
    await io.rmRF(RESULTS_PATH);
  });

  it('can diff snapshots', async function () {
    const diffResults = await diffSnapshots({
      parallelism: 1,
      basePath: path.resolve(__dirname, 'imgs', 'base'),
      mergeBasePath: path.resolve(__dirname, 'imgs', 'mergeBase'),
      currentPath: path.resolve(__dirname, 'imgs', 'current'),
      outputPath: path.resolve(RESULTS_PATH),
    });

    expect(diffResults).toEqual(
      expect.objectContaining({
        terminationReason: null,
        changedSnapshots: new Set(['acceptance/test.png']),
        missingSnapshots: new Set(['acceptance/both-base.png']),
        newSnapshots: new Set(['acceptance/added-in-current.png']),
        potentialFlakes: new Set([
          'acceptance/only-base.png',
          'acceptance/current-and-merge-base.png',
        ]),
      })
    );

    // Things should exist
    const results = await Promise.all([
      fs.access(path.resolve(RESULTS_PATH, 'diffs', 'acceptance', 'test.png')),
      fs.access(
        path.resolve(RESULTS_PATH, 'changed', 'acceptance', 'test.png')
      ),
      fs.access(
        path.resolve(RESULTS_PATH, 'original', 'acceptance', 'test.png')
      ),
      fs.access(
        path.resolve(RESULTS_PATH, 'missing', 'acceptance', 'both-base.png')
      ),
      fs.access(
        path.resolve(RESULTS_PATH, 'new', 'acceptance', 'added-in-current.png')
      ),
    ]);

    // fs.access will resolve with "error" value if it can not access file
    // so undefined means file/dir exists
    expect(results).toEqual(results.map(() => undefined));
  });

  it('terminates early if maxChangedSnapshots is exceeded', async function () {
    const diffResults = await diffSnapshots({
      parallelism: 1,
      maxChangedSnapshots: 1,
      basePath: path.resolve(__dirname, 'imgs', 'base'),
      mergeBasePath: path.resolve(__dirname, 'imgs', 'mergeBase'),
      currentPath: path.resolve(__dirname, 'imgs', 'current'),
      outputPath: path.resolve(RESULTS_PATH),
    });

    expect(diffResults).toEqual(
      expect.objectContaining({
        terminationReason: 'maxChangedSnapshots',
        changedSnapshots: new Set(['acceptance/test.png']),
        missingSnapshots: new Set([]),
        newSnapshots: new Set([]),
        potentialFlakes: new Set([]),
      })
    );

    // Things should exist
    const results = await Promise.all([
      fs.access(path.resolve(RESULTS_PATH, 'diffs', 'acceptance', 'test.png')),
      fs.access(
        path.resolve(RESULTS_PATH, 'changed', 'acceptance', 'test.png')
      ),
      fs.access(
        path.resolve(RESULTS_PATH, 'original', 'acceptance', 'test.png')
      ),
    ]);

    // fs.access will resolve with "error" value if it can not access file
    // so undefined means file/dir exists
    expect(results).toEqual(results.map(() => undefined));
  });

  it('can diff snapshots without merge base', async function () {
    const diffResults = await diffSnapshots({
      parallelism: 1,
      basePath: path.resolve(__dirname, 'imgs', 'base'),
      mergeBasePath: path.resolve(__dirname, 'imgs', 'invalidMergeBase'),
      currentPath: path.resolve(__dirname, 'imgs', 'current'),
      outputPath: path.resolve(RESULTS_PATH),
    });

    expect(diffResults).toEqual(
      expect.objectContaining({
        terminationReason: null,
        changedSnapshots: new Set(['acceptance/test.png']),
        missingSnapshots: new Set(['acceptance/both-base.png']),
        newSnapshots: new Set(['acceptance/added-in-current.png']),
        potentialFlakes: new Set([
          'acceptance/only-base.png',
          'acceptance/current-and-merge-base.png',
        ]),
      })
    );

    // Things should exist
    const results = await Promise.all([
      fs.access(path.resolve(RESULTS_PATH, 'diffs', 'acceptance', 'test.png')),
      fs.access(
        path.resolve(RESULTS_PATH, 'changed', 'acceptance', 'test.png')
      ),
      fs.access(
        path.resolve(RESULTS_PATH, 'original', 'acceptance', 'test.png')
      ),
      fs.access(
        path.resolve(RESULTS_PATH, 'missing', 'acceptance', 'both-base.png')
      ),
      fs.access(
        path.resolve(RESULTS_PATH, 'new', 'acceptance', 'added-in-current.png')
      ),
    ]);

    // fs.access will resolve with "error" value if it can not access file
    // so undefined means file/dir exists
    expect(results).toEqual(results.map(() => undefined));
  });

  it('diffs different sized snapshots', async function () {
    const diffResults = await diffSnapshots({
      parallelism: 1,
      basePath: path.resolve(__dirname, 'imgs', 'base'),
      mergeBasePath: path.resolve(__dirname, 'imgs', 'mergeBase'),
      currentPath: path.resolve(__dirname, 'imgs', 'size'),
      outputPath: path.resolve(RESULTS_PATH),
    });

    expect(diffResults).toEqual(
      expect.objectContaining({
        terminationReason: null,
        changedSnapshots: new Set([]),
        missingSnapshots: new Set(['acceptance/both-base.png']),
        newSnapshots: new Set(['acceptance/added-in-current.png']),
        potentialFlakes: new Set(['acceptance/only-base.png']),
      })
    );

    // Things should exist
    const results = await Promise.all([
      fs.access(path.resolve(RESULTS_PATH, 'diffs', 'acceptance', 'test.png')),
      fs.access(
        path.resolve(RESULTS_PATH, 'changed', 'acceptance', 'test.png')
      ),
      fs.access(
        path.resolve(RESULTS_PATH, 'missing', 'acceptance', 'both-base.png')
      ),
    ]);

    // fs.access will resolve with "error" value if it can not access file
    // so undefined means file/dir exists
    expect(results).toEqual(results.map(() => undefined));
  });
});
