export interface Country {
  slug: string;
  name: string;
  emoji: string;
  warehouses: string;
  highlight: string;
}

export const countries: Country[] = [
  { slug: 'us', name: 'United States', emoji: '🇺🇸', warehouses: '~633', highlight: 'The original — rotisserie chicken, $1.50 hot dog' },
  { slug: 'canada', name: 'Canada', emoji: '🇨🇦', warehouses: '~114', highlight: 'Poutine in the food court' },
  { slug: 'mexico', name: 'Mexico', emoji: '🇲🇽', warehouses: '~42', highlight: 'Torta al pastor, esquites, horchata' },
  { slug: 'japan', name: 'Japan', emoji: '🇯🇵', warehouses: '~37', highlight: 'Bulgogi bake, sushi platters, sakura items' },
  { slug: 'uk', name: 'United Kingdom', emoji: '🇬🇧', warehouses: '29', highlight: 'Jacket potatoes, scotch eggs, mince pies' },
  { slug: 'korea', name: 'South Korea', emoji: '🇰🇷', warehouses: '~20', highlight: 'Tteokbokki, Korean fried chicken, yakgwa' },
  { slug: 'australia', name: 'Australia', emoji: '🇦🇺', warehouses: '~15', highlight: 'Meat pies, lamingtons, pavlova' },
  { slug: 'taiwan', name: 'Taiwan', emoji: '🇹🇼', warehouses: '14', highlight: 'Bubble tea, beef noodle soup, pineapple cakes' },
  { slug: 'china', name: 'China', emoji: '🇨🇳', warehouses: '~7', highlight: 'Truffle pizza, earl grey soft serve, Peking duck roll' },
  { slug: 'spain', name: 'Spain', emoji: '🇪🇸', warehouses: '~5', highlight: 'Jamón ibérico, paella kits, croquetas' },
  { slug: 'france', name: 'France', emoji: '🇫🇷', warehouses: '3', highlight: 'Croque monsieur, canelés, madeleines' },
  { slug: 'sweden', name: 'Sweden', emoji: '🇸🇪', warehouses: '~2', highlight: 'Kanelbullar, princess cake, meatball rivalry' },
  { slug: 'iceland', name: 'Iceland', emoji: '🇮🇸', warehouses: '1', highlight: 'Gelato, Icelandic pylsur, kleinur' },
  { slug: 'new-zealand', name: 'New Zealand', emoji: '🇳🇿', warehouses: '1', highlight: 'Meat pies, lamingtons, pavlova debate' },
];
