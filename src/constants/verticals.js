/**
 * 100 Business Verticals / Categories in Alphabetical Order
 * Rotary Club of Erode Central
 */
export const VERTICAL_OPTIONS = [
  "Advertising & Branding",
  "Agriculture",
  "Animal Husbandry",
  "Apparel & Garments",
  "Architecture",
  "Artificial Intelligence",
  "Arts & Crafts",
  "Automobile Dealer",
  "Automobile Service",
  "Bakery",
  "Banking",
  "Beauty & Cosmetics",
  "Biotechnology",
  "Borewell & Drilling",
  "Building Materials",
  "Business Consulting",
  "Cable & Networking",
  "Catering Services",
  "Chemical Industry",
  "Civil Construction",
  "Cleaning Services",
  "Cloud Computing",
  "Communication Services",
  "Computer Hardware",
  "Computer Training Institute",
  "Construction Equipment",
  "Courier & Logistics",
  "Dairy Products",
  "Data Analytics",
  "Digital Marketing",
  "Electrical Contractor",
  "Electrical Equipment",
  "Electronics",
  "Engineering Services",
  "Event Management",
  "Export & Import",
  "Fashion Boutique",
  "Finance & Investment",
  "Financial Services",
  "Fitness & Gym",
  "Food Manufacturing",
  "Food Processing",
  "Furniture",
  "Glass & Aluminium",
  "Graphic Design",
  "Grocery & Supermarket",
  "Handicrafts",
  "Hardware Store",
  "Healthcare",
  "Home Appliances",
  "Home Decor",
  "Hospital",
  "Hotel & Hospitality",
  "HR & Recruitment",
  "Insurance",
  "Interior Design",
  "IT Services",
  "Jewellery",
  "Laboratory Services",
  "Legal Services",
  "Machine Manufacturing",
  "Manufacturing",
  "Marketing Agency",
  "Media & Entertainment",
  "Medical Equipment",
  "Mobile Store",
  "Networking Solutions",
  "Non-Profit Organization",
  "Packaging Industry",
  "Paint & Coatings",
  "Pharmacy",
  "Photography & Videography",
  "Poultry Farm",
  "Printing & Publishing",
  "Private Education",
  "Property Developer",
  "Public Relations",
  "Renewable Energy",
  "Restaurant",
  "Retail Business",
  "Rice Mill",
  "Safety Equipment",
  "Saloon & Spa",
  "School",
  "Security Services",
  "Software Development",
  "Solar Energy",
  "Sports & Recreation",
  "Steel & Metal Industry",
  "Textile Manufacturing",
  "Textile Trading",
  "Tours & Travels",
  "Transportation",
  "Veterinary Services",
  "Warehouse & Storage",
  "Waste Management",
  "Water Purification",
  "Web Design & Development",
  "Wholesale Trading",
  "Yoga & Wellness",
  "Other"
];

/**
 * Parse a vertical string or array into standard vertical selections and custom vertical text
 */
export function parseVerticals(verticalVal) {
  if (!verticalVal) return { standard: [], custom: '' };
  
  const rawList = Array.isArray(verticalVal)
    ? verticalVal
    : String(verticalVal).split(',').map(s => s.trim()).filter(Boolean);
  
  const standard = [];
  const customItems = [];

  rawList.forEach(item => {
    if (VERTICAL_OPTIONS.includes(item) && item !== 'Other') {
      if (!standard.includes(item)) standard.push(item);
    } else if (item === 'Other') {
      if (!standard.includes('Other')) standard.push('Other');
    } else if (item) {
      customItems.push(item);
    }
  });

  if (customItems.length > 0 && !standard.includes('Other')) {
    standard.push('Other');
  }

  return {
    standard,
    custom: customItems.join(', ')
  };
}

/**
 * Format standard vertical selections and custom text into a single comma-separated string
 */
export function formatVerticals(selectedList, customVal = '') {
  const list = Array.isArray(selectedList) ? [...selectedList] : (selectedList ? [selectedList] : []);
  const hasOther = list.includes('Other');
  const filtered = list.filter(item => item !== 'Other');

  if (hasOther && customVal && customVal.trim()) {
    const customList = customVal.split(',').map(s => s.trim()).filter(Boolean);
    customList.forEach(c => {
      if (!filtered.includes(c)) filtered.push(c);
    });
  } else if (hasOther && (!customVal || !customVal.trim()) && filtered.length === 0) {
    filtered.push('Other');
  }

  return filtered.join(', ');
}
