# Contributing

Thanks for helping build the Costco food catalog. Whether you're fixing a price, adding a recipe, or telling us about something wild your local Costco sells — we appreciate it.

This repo has three sections. Here's how to contribute to each.

---

## Adding a Recipe

Recipes go in `recipes/` in the appropriate subfolder. Every recipe should be something you've actually made — this isn't a place for theoretical dishes.

1. Create a new `.md` file in the right category folder
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

**Guidelines:**
- At least 2-3 main ingredients should be Costco items
- Include realistic prices and package sizes
- Cost-per-serving should be calculated, not guessed

---

## Updating Prepared Food Listings

Prepared food files live in `prepared/{country}/`. Each file covers one category (food court, deli, or bakery) for that country.

### Price Updates
Prices change. If you notice one that's wrong, update it and submit a PR. Include the date and your location in the PR description so we know it's not just regional variation.

### Adding Items
If your local Costco has an item we don't list:
1. Add it to the right table in the right country/category file
2. Include the price, size/quantity, and a brief description
3. Note if it's regional or seasonal

### Adding a New Country
If Costco operates somewhere we haven't covered:
1. Create a new folder under `prepared/`
2. Add at least a `food-court.md` file
3. Update `prepared/README.md` with links
4. Include the number of warehouses and notable items

---

## Adding Grocery Products

Grocery product files live in `products/`. Each file covers a category (meat, seafood, dairy, pantry, etc.).

### Adding a Product
1. Add it to the right table in the right category file
2. Include the typical price, package size, and a brief "Why It's Worth It" note
3. If it's a Kirkland Signature item, also consider adding it to `products/kirkland-signature.md`

### Price Updates
Same deal as prepared foods — prices vary by region and change over time. If you're updating a price, note your location and approximate date in the PR.

---

## General Guidelines

- **Prices:** Use local currency with approximate USD conversion for international items
- **Be specific:** "~3 lbs, serves 6-8" is better than "large"
- **Note regional/seasonal items:** Not everything is available everywhere
- **Keep it factual:** No sponsored content or brand promotion
- **Tone:** Warm and helpful in prose, factual in tables. A little personality is welcome.

## Questions?

Open an issue if you're unsure about anything.
