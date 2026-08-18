# DemoBlaze E2E Test Automation

End-to-end test automation for the [DemoBlaze](https://www.demoblaze.com/) store, built with
Playwright and TypeScript. A two case demo covering signing in and placing an order, running on
five browser profiles with a GitHub Actions pipeline.

| Deliverable     | Location                                                           |
| --------------- | ------------------------------------------------------------------ |
| Test case suite | [`docs/DemoBlaze-Test-Cases.xlsx`](docs/DemoBlaze-Test-Cases.xlsx) |
| Framework       | [`src/`](src/)                                                     |
| Demo scripts    | [`tests/`](tests/)                                                 |

---

## Steps to execute the demo scripts

Requires Node.js 20 or newer.

```bash
npm ci                                # install dependencies
npx playwright install --with-deps    # install browser binaries
npm test                              # run the demo
```

The demo is two cases, both in [`tests/demo.spec.ts`](tests/demo.spec.ts):

1. **Logs in with valid credentials** — signs in through the dialog and checks the session is
   reflected in the navigation bar.
2. **Adds a product to the cart and places an order** — signs in, adds a product, checks the cart
   line and total against the product page, submits the order, then checks the confirmation
   reports the right amount, name and card, and that the cart is emptied afterwards.

No `.env` file is needed. Every setting has a working default and the suite registers its own test
account through the API, so there are no credentials to arrange first.

To watch it run in a real browser:

```bash
npm run test:headed
```

To open the report afterwards:

```bash
npm run report
```

### Other commands

```bash
npm run test:smoke           # same two cases, by tag
npm run test:chromium        # a single browser
npm run test:cross-browser   # Chromium, Firefox and WebKit
npm run test:mobile          # Pixel 5 and iPhone 13 viewports
npm run test:headed          # watch it run
npm run test:debug           # step through with the inspector
npm run verify               # type check, lint and formatting
```

---

## Framework structure

```
src/
├── api/                   used only to provision a throwaway account
│   ├── api.client.ts      request wrapper with tolerant body parsing
│   └── auth.api.ts        sign up
├── config/
│   └── env.ts             typed configuration and every URL in one place
├── core/
│   ├── base.page.ts       navigation and landmark based load gates
│   ├── base.component.ts  component and modal contracts
│   └── types.ts           shared types
├── data/
│   └── test-data.ts       the demo product, a valid order, unique accounts
├── fixtures/
│   └── test.fixture.ts    page objects and the worker account, injected
├── pages/
│   ├── components/        navbar, login dialog, order dialog, confirmation
│   ├── home.page.ts
│   ├── product.page.ts
│   └── cart.page.ts
└── utils/
    ├── dialog.ts          native alert capture
    └── parse.ts           price and confirmation parsing

tests/
└── demo.spec.ts           the two demo cases
```

---

## Rationale

**`src/` is the framework, `tests/` is the specification.** Framework code holds no assertions
about the product, and test code holds no selectors. A selector change touches one page object; a
requirement change touches one spec.

**Page objects expose behaviour, never assertions.** They return state and perform actions; the
specification decides what is correct. The same page object then serves a positive check and a
negative one without changing.

```ts
// src/pages/product.page.ts returns what the application reported
async addToCart(): Promise<string> {
  const dialog = await captureDialog(this.page, () => this.addToCartButton.click());
  return dialog.message;
}

// tests/demo.spec.ts decides whether that is correct
expect(await productPage.addToCart()).toBe(AddToCartAlerts.authenticated);
```

**No magic values.** Selectors, user-visible copy, timeouts and column indexes are named constants
in the file that owns them. Expected messages such as `AddToCartAlerts` are exported, so the
specification asserts against the same constant the page object waits for.

**Fixtures instead of base classes.** Playwright's fixtures give dependency injection with automatic
setup and teardown, so there is no inheritance chain to follow. Each worker registers its own
throwaway account before its first test, so parallel workers can never collide on a shared cart and
the suite needs no credentials arranged in advance.

**The application under test is a legacy jQuery and Bootstrap site**, and three decisions follow
from that:

- It reports almost every outcome through a native `alert()`. Playwright auto-dismisses dialogs only
  while no listener is attached, so reading one means owning the whole handshake: attach, trigger,
  read, accept, detach. Because the alert fires from the request success callback, receiving it also
  proves the change was persisted, which removes a class of arbitrary waits.
- Animated overlays need explicit settling. Filling a Bootstrap modal mid-fade silently loses input,
  and clicking the purchase confirmation before it turns interactive dismisses it without
  confirming. Both waits live in `ModalComponent` and the confirmation component.
- Cart reads are eventually consistent, so `CartPage` polls for the expected row count and reloads
  if the view looks stale, rather than sleeping.

**Five browser profiles from one suite.** The same two cases run on Chromium, Firefox, WebKit and
two mobile viewports, selected by project rather than duplicated per browser.

---

## Configuration

Every value is read through `src/config/env.ts`, which validates types and applies defaults; nothing
else reads `process.env` directly. Copy `.env.example` to `.env` to override any of it.

```bash
BASE_URL=https://staging.example.com npm test
```

The most useful knobs are `BASE_URL`, `HEADLESS`, `WORKERS`, `RETRIES` and the timeout values.

---

## Reporting

Each run writes an Allure report to `allure-results/`, Playwright's own HTML report to
`playwright-report/`, JUnit XML to `reports/junit/` and JSON to `reports/json/`. Traces are captured
on the first retry, with screenshots and video kept on failure, so a failure gives a full timeline
with DOM snapshots and network activity.

```bash
npm run report            # Playwright HTML report
npx playwright show-trace test-results/<test-folder>/trace.zip
```

### Allure

Generating the Allure report needs a JRE on the path, which the Allure command line tool uses.

```bash
npm run test:allure       # run the demo, then build the report
npm run allure:open       # open the built report

npm run allure:serve      # or serve the raw results without building
```

Because each case is written as named `test.step()` calls, the Allure timeline reads as the journey
itself: _open the store_, _sign in through the login dialog_, _add a product to the cart_, _place the
order_, _the confirmation reports the order_. The report also records the environment it ran
against.

In CI every browser uploads its raw results, a final job merges them into one report, and that report
is published to GitHub Pages and attached to the run as an artefact:

**https://qa-io-vn.github.io/demoblaze-e2e-automation/**

---

## Continuous integration

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on push, pull request and manual
dispatch: static analysis gates the run, then the demo runs on Chromium, Firefox and WebKit in
parallel, and a final job merges the Allure results from all three into a single published report.
Reports are uploaded as artefacts, with traces and video kept on failure.

---

## Notes

The application under test is a shared public demo, so response times vary. Timeouts default high
and one retry is configured locally, two in CI. If tests are slow or flaky, reduce contention:

```bash
WORKERS=2 npm test
```
