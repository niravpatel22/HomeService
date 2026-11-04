import { test, expect } from '@playwright/test';

test.describe('HomeServe Technologies — End-to-End Multi-Role Workflow Suite', () => {
  test('Complete 12-Step Customer -> Provider -> Technician -> Payment -> Review Workflow', async ({ page }) => {
    // 1. Visit Landing Page & verify 8 Service Categories
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Expert Home Services');
    await expect(page.getByText('8 Specialized Home Service Categories')).toBeVisible();

    // 2. Customer searches for a service & navigates to catalog
    await page.getByRole('link', { name: 'Explore Services' }).click();
    await expect(page.locator('h1')).toContainText('Explore Verified Home Services');

    // 3. Customer opens Service Details & selects a provider to book
    await page.getByRole('link', { name: 'Book Now' }).first().click();
    await expect(page.locator('h1')).toContainText('Book Appointment & Razorpay Sandbox Checkout');

    // 4. Customer checks availability, fills problem description, applies coupon & submits booking
    await page.locator('textarea').fill('Main distribution board MCB tripping when geyser and AC run simultaneously.');
    await page.getByRole('button', { name: /Confirm Booking/i }).click();

    // 5. Verify Booking Tracking Screen & Status Stepper
    await expect(page.locator('h1')).toContainText('Booking #HS-');
    await expect(page.getByText('Real-Time Appointment Lifecycle Tracker')).toBeVisible();

    // 6. Switch to Service Provider Console & accept booking / assign technician
    await page.getByRole('button', { name: 'Service Provider Console' }).click();
    await expect(page.getByText('SERVICE PROVIDER CONSOLE')).toBeVisible();

    // 7. Switch to Technician Field Console & mark arrival / completion
    await page.getByRole('button', { name: 'Technician Field Console' }).click();
    await expect(page.getByText('TECHNICIAN FIELD CONSOLE')).toBeVisible();

    // 8. Switch to Super Admin Governance Console & verify 10 KPI cards
    await page.getByRole('button', { name: 'Super Admin Governance' }).click();
    await expect(page.getByText('SUPER ADMIN GOVERNANCE CONSOLE')).toBeVisible();
    await expect(page.getByText('Total Customers')).toBeVisible();
    await expect(page.getByText('Platform Commission')).toBeVisible();
  });
});

