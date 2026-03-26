export interface Country {
  slug: string;
  name: string;
  iso: string;
  warehouses: string;
  highlight: string;
}

export const countries: Country[] = [
  { slug: 'us', name: 'United States', iso: 'us', warehouses: '~633', highlight: 'The original — rotisserie chicken, $1.50 hot dog' },
  { slug: 'canada', name: 'Canada', iso: 'ca', warehouses: '~114', highlight: 'Poutine in the food court' },
  { slug: 'mexico', name: 'Mexico', iso: 'mx', warehouses: '~42', highlight: 'Torta al pastor, esquites, horchata' },
  { slug: 'japan', name: 'Japan', iso: 'jp', warehouses: '~37', highlight: 'Bulgogi bake, sushi platters, sakura items' },
  { slug: 'uk', name: 'United Kingdom', iso: 'gb', warehouses: '29', highlight: 'Jacket potatoes, scotch eggs, mince pies' },
  { slug: 'korea', name: 'South Korea', iso: 'kr', warehouses: '~20', highlight: 'Tteokbokki, Korean fried chicken, yakgwa' },
  { slug: 'australia', name: 'Australia', iso: 'au', warehouses: '~15', highlight: 'Meat pies, lamingtons, pavlova' },
  { slug: 'taiwan', name: 'Taiwan', iso: 'tw', warehouses: '14', highlight: 'Bubble tea, beef noodle soup, pineapple cakes' },
  { slug: 'china', name: 'China', iso: 'cn', warehouses: '~7', highlight: 'Truffle pizza, earl grey soft serve, Peking duck roll' },
  { slug: 'spain', name: 'Spain', iso: 'es', warehouses: '~5', highlight: 'Jamón ibérico, paella kits, croquetas' },
  { slug: 'france', name: 'France', iso: 'fr', warehouses: '3', highlight: 'Croque monsieur, canelés, madeleines' },
  { slug: 'sweden', name: 'Sweden', iso: 'se', warehouses: '~2', highlight: 'Kanelbullar, princess cake, meatball rivalry' },
  { slug: 'iceland', name: 'Iceland', iso: 'is', warehouses: '1', highlight: 'Gelato, Icelandic pylsur, kleinur' },
  { slug: 'new-zealand', name: 'New Zealand', iso: 'nz', warehouses: '1', highlight: 'Meat pies, lamingtons, pavlova debate' },
];
