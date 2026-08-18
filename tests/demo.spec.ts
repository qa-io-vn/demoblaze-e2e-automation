import { buildOrder, DEMO_PRODUCT } from '../src/data/test-data';
import { expect, test } from '../src/fixtures/test.fixture';
import { CONFIRMATION_HEADING } from '../src/pages/components/purchase-confirmation.component';
import { AddToCartAlerts } from '../src/pages/product.page';

const SINGLE_ITEM = 1;
const EMPTY_CART = 0;
const ORDER_ID_PATTERN = /^\d+$/;

test.describe('DemoBlaze automation demo', () => {
  test('logs in with valid credentials', { tag: ['@smoke'] }, async ({ homePage, account }) => {
    await test.step('open the store', async () => {
      await homePage.open();
      await homePage.waitForCatalog();
    });

    await test.step('sign in through the login dialog', async () => {
      await homePage.navbar.openLoginModal();
      await homePage.loginModal.waitUntilVisible();
      await homePage.loginModal.login(account);
    });

    await test.step('the session is reflected in the navigation bar', async () => {
      await homePage.navbar.waitForLoggedIn();
      expect(await homePage.navbar.loggedInUsername()).toBe(account.username);
      await expect(homePage.navbar.loginLink).toBeHidden();
      await expect(homePage.navbar.logoutLink).toBeVisible();
    });
  });

  test(
    'adds a product to the cart and places an order',
    { tag: ['@smoke'] },
    async ({ homePage, productPage, cartPage, account }) => {
      const order = buildOrder();

      await test.step('sign in', async () => {
        await homePage.open();
        await homePage.waitForCatalog();
        await homePage.navbar.openLoginModal();
        await homePage.loginModal.waitUntilVisible();
        await homePage.loginModal.login(account);
        await homePage.navbar.waitForLoggedIn();
      });

      const price = await test.step('add a product to the cart', async () => {
        await homePage.openProduct(DEMO_PRODUCT.title);
        await productPage.waitUntilLoaded();
        expect(await productPage.productName()).toBe(DEMO_PRODUCT.title);

        const productPrice = await productPage.price();
        expect(await productPage.addToCart()).toBe(AddToCartAlerts.authenticated);
        return productPrice;
      });

      const cartTotal =
        await test.step('the cart lists the product at the right price', async () => {
          await productPage.navbar.goToCart();
          await cartPage.waitUntilLoaded();
          await cartPage.waitForItemCount(SINGLE_ITEM);

          const items = await cartPage.items();
          expect(items[0].title).toBe(DEMO_PRODUCT.title);
          expect(items[0].price).toBe(price);

          const total = await cartPage.total();
          expect(total).toBe(price);
          return total;
        });

      await test.step('place the order', async () => {
        const orderModal = await cartPage.placeOrder();
        expect(await orderModal.displayedTotal()).toBe(cartTotal);

        await orderModal.fill(order);
        await orderModal.purchase();
      });

      await test.step('the confirmation reports the order', async () => {
        await cartPage.confirmation.waitUntilShown();
        expect(await cartPage.confirmation.headingText()).toBe(CONFIRMATION_HEADING);

        const details = await cartPage.confirmation.details();
        expect(details.id).toMatch(ORDER_ID_PATTERN);
        expect(details.amount).toBe(cartTotal);
        expect(details.name).toBe(order.name);
        expect(details.cardNumber).toBe(order.creditCard);
      });

      await test.step('the cart is emptied once the order is confirmed', async () => {
        await cartPage.confirmation.confirm();
        await cartPage.open();
        await cartPage.waitForItemCount(EMPTY_CART);
      });
    },
  );
});
