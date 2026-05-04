import os
from playwright.sync_api import sync_playwright

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Get absolute path to index.html
        path = os.path.abspath("index.html")
        page.goto(f"file://{path}")

        # Wait for SVG to be rendered (it's immediate in JS but let's be sure)
        page.wait_for_selector("svg")

        # Create screenshots directory
        os.makedirs("verification/screenshots", exist_ok=True)

        # Full page screenshot
        page.screenshot(path="verification/screenshots/full_page_v2.png", full_page=True)

        # Specific sections
        page.locator("#map").screenshot(path="verification/screenshots/map_v2.png")
        page.locator("#elevation").screenshot(path="verification/screenshots/elevation_v2.png")

        print("Screenshots captured in verification/screenshots/")
        browser.close()

if __name__ == "__main__":
    verify()
