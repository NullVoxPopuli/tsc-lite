# tsc-lite

`tsc --build --watch`, but for humans

Ever get bogged down by 2000+ typescript errors because "one thing" broke
a whole bunch of downstream things?

Now you can focus on the originating errors without losing track.
You are finally able to ignore errors that _might not even exist_ once the root
errors are resolved.

_Especially helpful in monorepos_.

## Install

```bash
npm install -g tsc-lite
# or
yarn global add tsc-lite
# or
volta install tsc-lite
```

## Usage

```bash
tsc-lite
```

_Requirements_
* Node 14+
* `tsc` (install `typescript` globally)


