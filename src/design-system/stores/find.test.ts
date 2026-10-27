import { beforeEach, describe, expect, it } from 'vitest';
import { $findQuery, seedFindQuery, setFindQuery } from './find';

describe('seedFindQuery', () => {
  beforeEach(() => setFindQuery('지난 검색어'));

  it('puts a one-line selection in as the query', () => {
    seedFindQuery('개발자');
    expect($findQuery.get()).toBe('개발자');
  });

  it('drops the spaces and line break a triple-click selection carries at its ends', () => {
    seedFindQuery('  첫 문단 전체\n');
    expect($findQuery.get()).toBe('첫 문단 전체');
  });

  it('keeps the last query when the selection spans lines', () => {
    seedFindQuery('첫 줄\n둘째 줄');
    expect($findQuery.get()).toBe('지난 검색어');
  });

  it('keeps the last query when nothing (or only spaces) is selected', () => {
    seedFindQuery('');
    expect($findQuery.get()).toBe('지난 검색어');
    seedFindQuery(' \n ');
    expect($findQuery.get()).toBe('지난 검색어');
  });
});
