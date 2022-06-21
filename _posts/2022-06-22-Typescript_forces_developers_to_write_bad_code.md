# Typescript forces developers to write bad code

Consider the following simple types `A` and `B`.

```typescript
type A = {
    a: string;
}

type B = {
    b: string;
}
```

And a function `f1` that can take an A and return FA or a B and return FB.

```typescript
type FA = {
    f: A;
};

type FB = {
    f: B;
};

function f1(a: A): FA;
function f1(b: B): FB;
// function f1(aOrB: A|B): FA|FB;
function f1(aOrB: A|B) { return {f: aOrB}};
```

Now consider that we have an array of A or B objects and we want to apply f1 to them.  This should be as simple as this:

```typescript
const arrayAorB: Array<A|B> = [{a: 'aye'}, {b: 'bee'}];

const r1 = arrayAorB.map(aOrB => f1(aOrB))  // <== Typescript error here on call to f1
```

Typescript will complain about the call to f1 with:

```
No overload matches this call.
  Overload 1 of 2, '(a: A): FA', gave the following error.
    Argument of type 'A | B' is not assignable to parameter of type 'A'.
      Property 'a' is missing in type 'B' but required in type 'A'.
  Overload 2 of 2, '(b: B): FB', gave the following error.
    Argument of type 'A | B' is not assignable to parameter of type 'B'.
      Property 'b' is missing in type 'A' but required in type 'B'.ts(2769)
```

This is because our `arrayAorB` is of type `A | B` but the function `f1` only takes `A` or `B` and doesn't understand `A | B`.

## Option 1: Add an `A | B` input type

In the declaration of `f1` above, 1 line has been commented out.  If we restore this line, then Typescript will no longer
complain.

```typescript
function f1(aOrB: A|B): FA|FB;
```

But this type indicates that the function can return either `FA` or `FB` regardless of which type the input is. 
This is not an accurate description of the type.

## Option 2: Separate the types before calling `f1`

The other option is to put a conditional into the loop to call `f1` with each type separately.  This will require a [Type Predicate](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates) `isA`.

```typescript
function isA(x: A|B): x is A { return 'a' in x };

const r3 = arrayAorB.map(aOrB => {
    if(isA(aOrB))
        return f1(aOrB)
    return f1(aOrB)
})
```

The problem with this solution lies in having branching code, where the `if` and the `else` branches are identical code.
This is confusing to the reader and is bad code.

## No good options

My preference would be for Option 1.  Sure the type's not entirely accurate, but at least we're not introducing 
redundant branching logic into actual Javascript code.  And I guess I also care less about the types and more about 
the code.

In the project I'm currently working on we have 6 similar types and our team's strict Typescript guy recommends
and writes code with Option 2. As a result there are now have a few places in 
the code where we have a `switch` statement with 6 branches - most with identical code. 

I agree that Option 2 is more "correct" for typing, but is this really worth writing bad/duplicated code?