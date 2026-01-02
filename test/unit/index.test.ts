import { sum } from '../../src/index';

describe('sum', () => {
  it('正常系: 1+2=3', () => {
    expect(sum(1, 2)).toBe(3);
  });
});
