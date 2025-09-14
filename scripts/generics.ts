type Return<T extends string | number> = T extends string ? string : number;
type Obj<T extends string | number> = {
	foo: T;
	bar: Return<T>;
};

const createThing = <T extends string | number, B extends Obj<T>>(thing: T, obj: B): Return<T> => {
	return (typeof thing === 'string' ? 'string' : 123) as Return<T>;
};

const thing = createThing('50', {
	foo: '50',
	bar: '40'
});
