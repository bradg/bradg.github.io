
type A = {
    a: string;
}

type B = {
    b: string;
}

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

const arrayAorB: Array<A|B> = [{a: 'aye'}, {b: 'bee'}];

const r1 = arrayAorB.map(aOrB => f1(aOrB))

function isA(x: A|B): x is A { return 'a' in x };

const r3 = arrayAorB.map(aOrB => {
    if(isA(aOrB))
        return f1(aOrB)
    // The line above and the line below are identical.  This is bad code.
    return f1(aOrB)
})

// Ultimately, the choice seems to be either allow the A|B => FA|FB type explicitly,
// or loop through the results with a conditional even though both the `if` and `else` paths are identical.