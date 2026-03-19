# Contributing

Thanks for helping build the Costco food catalog! Here's how to contribute.

## Adding a Recipe

1. Create a new `.md` file in the appropriate `recipes/` subfolder
2. Use this format:

```markdown
# Recipe Title

> One-line description of the recipe.

**Prep:** X min | **Cook:** Y min | **Servings:** Z | **Cost:** ~$X.XX/serving

## Costco Shopping List
- Product Name — amount needed (~$price, package size)

## Other Ingredients
- amount unit ingredient name
- amount unit ingredient name *(optional)*

## Instructions
1. First step.
2. Second step.

> **Tip:** Helpful tip here.

## Storage
How to store leftovers and how long they last.

## Leftover Ideas
- What to do with leftovers
```

3. Add your recipe to `recipes/README.md`
4. Submit a pull request

## Updating Product Listings

Product files are in `products/{country}/`. Each file covers one category (food court, deli, or bakery) for that country.

### Price Updates
Prices change. If you notice a price is wrong, update it and submit a PR. Include the date and your location in the PR description.

### Adding Items
If your local Costco has an item not listed:
1. Add it to the appropriate table in the right country/category file
2. Include the price, size/quantity, and a brief description
3. Note if it's regional or seasonal

### Adding a New Country
If Costco operates in a country not yet covered:
1. Create a new folder under `products/`
2. Add at least a `food-court.md` file
3. Update `products/README.md` with links
4. Include the number of warehouses and notable items

## Guidelines

- **Prices:** Use local currency with approximate USD conversion for international items
- **Be specific:** "~3 lbs, serves 6-8" is better than "large"
- **Note regional/seasonal items:** Not everything is available everywhere
- **Keep it factual:** No sponsored content or brand promotion
- **Recipes should use Costco products:** At least 2-3 main ingredients should be Costco items

## Questions?

Open an issue if you're unsure about anything.
