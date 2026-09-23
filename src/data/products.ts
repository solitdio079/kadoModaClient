import type { Product } from '../lib/catalog';

// Step 1 preview fixtures only. Negative IDs cannot be mistaken for database IDs.
// Step 2 will seed these through an authenticated server workflow with a deletion manifest.
export const demoProducts: Product[] = [
  { id: -1, name: 'Drapeli Saten Elbise', category: 'Elbiseler', color: 'Şampanya', price: 189000, stock: 12, sizes: ['S', 'M', 'L'], images: ['/assets/satin-dress.png'], label: 'YENİ SEZON', details: 'Akışkan silüeti ve zarif drapeleriyle günün her anına eşlik eden saten elbise.' },
  { id: -2, name: 'Noir Klasik Blazer', category: 'Ceketler', color: 'Siyah', price: 249000, stock: 8, sizes: ['S', 'M', 'L', 'XL'], images: ['/assets/black-blazer.png'], label: 'SEÇKİMİZDEN', details: 'Güçlü bir silüet, yalın bir duruş. Klasik kesimiyle gardırobunuzun tamamlayıcı parçası.' },
  { id: -3, name: 'Fiyonk Detaylı Bluz', category: 'Üst Giyim', color: 'Ekru', price: 129000, stock: 15, sizes: ['S', 'M', 'L'], images: ['/assets/silk-blouse.png'], label: 'YENİ SEZON', details: 'Fiyonk detayı ve yumuşak dokusuyla sade kombinlere zarif bir dokunuş.' },
  { id: -4, name: 'Rose Triko Takım', category: 'Takımlar', color: 'Gül Kurusu', price: 169000, stock: 7, sizes: ['S', 'M', 'L'], images: ['/assets/rose-knit.png'], label: 'SEÇKİMİZDEN', details: 'Tonal renkler ve rahat bir silüet. Birlikte ya da ayrı ayrı kombinlenebilen iki parça.' },
  { id: -5, name: 'Gold Line Midi Etek', category: 'Etekler', color: 'Altın', price: 145000, stock: 9, sizes: ['S', 'M', 'L'], images: ['/assets/gold-skirt.png'], details: 'Işığı yakalayan dokusu ve midi boyuyla özel anlara eşlik eden zamansız etek.' },
  { id: -6, name: 'Ivory Gece Elbisesi', category: 'Elbiseler', color: 'Fildişi', price: 299000, stock: 4, sizes: ['S', 'M', 'L'], images: ['/assets/ivory-evening.png'], label: 'ÖZEL SEÇKİ', details: 'Özel davetler için tasarlanan, fildişi tonunda sade ve etkileyici bir silüet.' },
  { id: -7, name: 'Cocoa Trençkot', category: 'Dış Giyim', color: 'Kahverengi', price: 225000, stock: 11, sizes: ['S', 'M', 'L', 'XL'], images: ['/assets/cocoa-trench.png'], label: 'YENİ SEZON', details: 'Mevsim geçişlerinin vazgeçilmezi. Sıcak tonları ve kuşak detayıyla tamamlanan klasik trençkot.' },
  { id: -8, name: 'Pearl Omuz Çantası', category: 'Aksesuar', color: 'İnci', price: 115000, stock: 6, sizes: ['Standart'], images: ['/assets/pearl-bag.png'], details: 'Gündüzden geceye, her stile uyum sağlayan kompakt ve zarif omuz çantası.' },
].map(p => ({ ...p, demo: true }));
