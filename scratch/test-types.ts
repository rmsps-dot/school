function test1<T extends (...args: never[]) => Promise<unknown>>(fn: T) {
  return fn;
}

test1(async (a: string) => { console.log(a); });
