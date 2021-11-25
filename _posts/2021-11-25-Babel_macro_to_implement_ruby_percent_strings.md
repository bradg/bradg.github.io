# Javascript babel macro to implement Ruby percent strings

Now that I'm mostly doing Javascript, one of the things I miss about ruby is how it is focussed on making life easy for developers.  

One simple example, is how ruby makes it easy to get an array of strings, without all the ugly syntax of quotes and commas getting
in the way.

For example:

```ruby
fields = %w(name age address)
# => ["name", "age", "address"]
```

This beautful shortcut allows developers to focus on the intent of the code - that `fields` contains name, age and address - without the
syntax getting in the way.

Since I've been looking into babel-macros, I wondered if it would be possible to bring this into my Javascript.

```javascript
const fields = ['name', 'age', 'address']
```

I could (and have previously) implemented this by simply calling `split` on the string

```javascript
const fields = "name age address".split(' ')
```

But this adds a function call, which increases the complexity of the code, and makes it hards to understand the intent of the code.

So, is there a way this could be done with macros?

## babel-macros cannot change the syntax of Javascript

Could I create a `%w` macro that could do this in Javascript?

```javascript
const fields = %w(name age address)
// => SyntaxError: Unexpected token '%'
```

Parsing code happens in a few steps.  One of these is tokenization (breaking the code up into tokens) and this happens before babel-macros gets
access to the code.  So, if I want to use a babel-macro then my macro cannot implement changes to the Javascript syntax.

A full babel plugin can hook into the tokenization though.  See [this example](https://lihautan.com/creating-custom-javascript-syntax-with-babel/)
where `@@` is added as token to allow any function declaration to be curried.

## A ruby-style percent-string inside a Javascript syntax?

Ruby supports a variety of string delimiters in its `%w`

```ruby
a = %w(a b c)
b = %w/a b c/
c = %w[a b c]
d = %w$a b c$
e = %w%a b c%
f = %w{a b c}
g = %w|a b c|
h = %w<a b c>
# => all of these produce the same output: ['a', 'b', 'c']
```

So I came up with this format for Javascript

```javascript
const fields = w`name age address`
```

We can't have a `%` character sitting in front of the `w` - that just won't work without changing the syntax.  But we can make use
of Javascript's [tagged template](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) strings.

The best way now, is to use [AST Explorer](https://astexplorer.net/#/gist/0db6139d6dc95d849f33b20bcf75a277/b176a6b0e8f05af3103fb53d2a8ffaa5e0b39ab3)
to explore the AST and experiment with the macro code.  You can see in this link some of my test examples and the resulting output.

As a result I came up with the following macro code:

```javascript
module.exports = createMacro(myMacro);

function myMacro({ references, state, babel }) {
  const t = babel.types;
  const escapedSpace = '<<ESCAPED-SPACE>>'
  references.w.forEach((ref) => { 
    // TODO: verify part of a TemplateLiteral
    console.log('ref', ref)
    const par = ref.findParent(r => r.type === 'TaggedTemplateExpression')
    console.log('par', par)
    const str = par.node.quasi.quasis.map(q => q.value.raw).join(' ')
    console.log('str', str)
    const str2 = str.replace(/\\ /, escapedSpace)
    console.log('str2', str2)
    const arr = t.ArrayExpression(str2.split(/\s+/).map(v => t.StringLiteral(v.replace(escapedSpace,' '))))
    console.log('arr', arr)
    par.replaceWith(arr)
  })
}
```

> To see the result of `console.log` in AST Explorer, just open the browser's dev tools (F12)

## How to make it available as a babel-macro

The [babel-plugins-macro-example](https://github.com/kentcdodds/babel-plugin-macros-example) is a great base code template to use for creating
your own macros as it comes with tests ready to go.  Clone & copy this.  Then add your own tests:

\_\_fixtures__/examples/code.js
```javascript
import {w} from '../../string-literals.macro'

const inp = w`hello world`
const in3 = w`how  are
    you	today`
const in4 = w`hello world ${ignore} x ${ok}`
const escapeSpaces = w`age birth\ year`
```

\_\_fixtures__/example/output.js
```javascript
const inp = ['hello', 'world'];
const in3 = ['how', 'are', 'you', 'today'];
const in4 = ['hello', 'world', 'x', ''];
const escapeSpaces = ['age', 'birth year']
```

and then run `yarn test` to ensure the tests pass.

Full source to my string-literals code is on Github at [https://github.com/bradg/string-literals-macro](https://github.com/bradg/string-literals-macro)

## Next steps

The code in the AST Explorer link above handles basic usage of a simple string - without any template variables (eg `${x}`) inside it.
Template variables in the template string will just be ignored for now.  In ruby, you can use template variables inside by using
an uppercase `W` instead of lowercase.

```ruby
ageFieldName = "age"
fields = %W(name #{ageFieldName} address)
# => ["name", "age", "address"]
# Note the uppercase %W and not %w
```
