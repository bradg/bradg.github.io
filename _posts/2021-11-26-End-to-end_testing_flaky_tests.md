# End-to-End Testing. Fixing "flaky" tests

This was marked as a flaky test:

```javascript
describe('Table sorting', () => {
    test('sorting LTV asc', async () => {
        await searchPage.clickOnColumn('LTV');
        const ltvValues = await searchPage.getRowValuesByName('LTV')
        expect(ltvValues).toEqual(ltvValues.concat().sort())
    })
    test('sorting LTV desc', async () => {
        await searchPage.clickOnColumn('LTV');
        const ltvValues = await searchPage.getRowValuesByName('LTV')
        expect(ltvValues).toEqual(ltvValues.concat().sort().reverse())
    })
})
```

It was intially identified as flaky, and then to improve the chances of it passing, it was wrapped in a retry block and a 2 second wait was added to the 
`clickOnColumn` method.  Eventually, the whole block was marked as `.skip` as it was too hard to get right.

Points to note:

1. Using `wait` for a number of seconds is never a good way to test.  You should always find something to wait for on the page in order to continue.
1. The second test (which clicks LTV again) is dependant on the first running.  These should be combined into a single test.

One of the problems that made testing this table difficult was that when the column header was clicked, the indicator that it was now sorted by 
that column was an SVG icon next to the header text.

So, to detect the SVG.

```javascript
page.waitForXPath(`//th[contains(.,"${columnLabel}")]`)
// => This can get the TH.  To wait on an SVG with a name of chevronUp
page.waitForXPath(`//th[contains(.,"${columnLabel}")]//*[local-name()="svg" and @name="${chevronName}"]`)
```

This should have worked.  But there may have been a delay between when the SVG was updated to when the data in the table was updated.

So, what could I wait for before checking that the values are now in order?

The answer is in the question :)

Just wait for the values _to be_ in order!

This can be done, but any `waitForFunction` has to be run inside the browser.  So I changed the `expect` line to a waitForFunction:

```javascript
const ltvColumnNumber = 10; // This is the index of the column we want to verify sort
await page.waitForFunction(
    async colNumber => {
        const values = [...document.querySelectorAll(`td:nth-child(${colNumber})`)].map(c => c.textContent);
        return values.toString() === values.concat().sort().toString();
    },
    {},
    ltvColumnNumber,
)
```

The benefit of this, is that we don't wait an arbitrary amount of time to see if it's ready yet, which will always either be wasting
time or not be enough time.  The `waitForFunction` will also fail and so too will the test if the function 
times out and does not find the values in sorted order.

> Thing that I learnt:  Rather than waiting for something arbitrary to tell you the expectation should be ready, just wait for the expectation to be true.