import { Course, TeeBox } from "@/types/golf";

// Generate realistic GPS coordinates for NY area courses
const generateNYCoordinates = (region: 'nyc' | 'longisland' | 'westchester' | 'upstate' | 'central' | 'western') => {
  let baseLat: number, baseLng: number;
  
  switch (region) {
    case 'nyc':
      baseLat = 40.7128; baseLng = -74.0060; break;
    case 'longisland':
      baseLat = 40.7891; baseLng = -73.1350; break;
    case 'westchester':
      baseLat = 41.1220; baseLng = -73.7949; break;
    case 'upstate':
      baseLat = 42.3601; baseLng = -71.0589; break;
    case 'central':
      baseLat = 43.0481; baseLng = -76.1474; break;
    case 'western':
      baseLat = 42.8864; baseLng = -78.8784; break;
  }
  
  const latOffset = (Math.random() - 0.5) * 0.3;
  const lngOffset = (Math.random() - 0.5) * 0.5;
  
  return {
    lat: baseLat + latOffset,
    lng: baseLng + lngOffset
  };
};

const generateTeeBoxes = (par: number, baseCoords: { lat: number; lng: number }): TeeBox[] => {
  const teeConfigs = [
    { name: "Black", color: "#000000", multiplier: 1.0, rating: 75.2, slope: 142 },
    { name: "Blue", color: "#0066CC", multiplier: 0.92, rating: 72.8, slope: 135 },
    { name: "White", color: "#FFFFFF", multiplier: 0.85, rating: 70.1, slope: 128 },
    { name: "Red", color: "#CC0000", multiplier: 0.75, rating: 67.5, slope: 118 }
  ];

  const baseYardages = {
    3: { min: 120, max: 200 },
    4: { min: 300, max: 450 },
    5: { min: 480, max: 580 }
  };

  const baseYardage = baseYardages[par as keyof typeof baseYardages];
  const yardage = Math.floor(Math.random() * (baseYardage.max - baseYardage.min) + baseYardage.min);

  return teeConfigs.map(config => ({
    name: config.name,
    color: config.color,
    coords: {
      lat: baseCoords.lat + (Math.random() - 0.5) * 0.001,
      lng: baseCoords.lng + (Math.random() - 0.5) * 0.001
    },
    yardage: Math.floor(yardage * config.multiplier),
    rating: config.rating + (Math.random() - 0.5) * 4,
    slope: config.slope + Math.floor((Math.random() - 0.5) * 20)
  }));
};

const generateCoursePhotos = () => {
  const stockPhotos = [
    "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800",
    "https://images.unsplash.com/photo-1592919505780-303950717480?w=800",
    "https://images.unsplash.com/photo-1587174486073-ae5e5cec4540?w=800",
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
    "https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=800",
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800"
  ];
  
  return {
    hero: stockPhotos[Math.floor(Math.random() * stockPhotos.length)],
    clubhouse: stockPhotos[Math.floor(Math.random() * stockPhotos.length)],
    holes: Array(3).fill(0).map(() => stockPhotos[Math.floor(Math.random() * stockPhotos.length)])
  };
};

const generateCourseAmenities = () => {
  const allAmenities = ["Pro Shop", "Restaurant", "Driving Range", "Putting Green", "Cart Rental", "Club Rental", "Lessons Available", "Bar & Grill", "Event Space", "Locker Rooms"];
  const numAmenities = Math.floor(Math.random() * 5) + 4; // 4-8 amenities
  return allAmenities.sort(() => 0.5 - Math.random()).slice(0, numAmenities);
};

const generateGreenFees = () => ({
  weekday: Math.floor(Math.random() * 80) + 40, // $40-120
  weekend: Math.floor(Math.random() * 100) + 60, // $60-160
  twilight: Math.floor(Math.random() * 50) + 30 // $30-80
});

const architects = ["Robert Trent Jones", "A.W. Tillinghast", "Donald Ross", "Pete Dye", "Tom Fazio", "Jack Nicklaus", "Arnold Palmer", "Rees Jones"];

const generateHoles = (numHoles: number, coursePar: number, region: 'nyc' | 'longisland' | 'westchester' | 'upstate' | 'central' | 'western') => {
  const holes = [];
  const baseCoords = generateNYCoordinates(region);
  
  const parDistribution = numHoles === 18 
    ? [4,4,3,4,5,3,4,4,4,4,4,3,5,4,4,3,4,5] // Standard 18-hole par distribution
    : Array(numHoles).fill(0).map((_, i) => 
        i % 6 === 2 || i % 6 === 5 ? 3 : i % 6 === 4 ? 5 : 4); // 9-hole distribution

  const handicapOrder = numHoles === 18 
    ? [1,3,5,7,9,11,13,15,17,2,4,6,8,10,12,14,16,18] // Standard handicap order
    : [1,3,5,7,9,2,4,6,8]; // 9-hole handicap order
  
  const hazardTypes = ["water", "bunker", "trees", "rough", "out of bounds"];
  const doglegs = ["left", "right", "none"];
  
  for (let i = 0; i < numHoles; i++) {
    const holeOffset = (i / numHoles) * 0.02;
    const teeCoords = {
      lat: baseCoords.lat + holeOffset + (Math.random() - 0.5) * 0.005,
      lng: baseCoords.lng + holeOffset + (Math.random() - 0.5) * 0.008
    };
    
    const greenCoords = {
      lat: teeCoords.lat + (Math.random() - 0.5) * 0.003,
      lng: teeCoords.lng + (Math.random() - 0.5) * 0.004 + 0.002
    };

    const par = parDistribution[i] || 4;
    const teeBoxes = generateTeeBoxes(par, teeCoords);
    const distance = teeBoxes[1].yardage; // Use blue tee yardage as default

    holes.push({
      holeNumber: i + 1,
      par,
      teeBoxes,
      teeCoords, // Keep for backward compatibility
      greenCoords,
      distance, // Keep for backward compatibility
      handicap: handicapOrder[i] || (i + 1),
      dogleg: Math.random() > 0.7 ? doglegs[Math.floor(Math.random() * 2)] as 'left' | 'right' : 'none',
      hazards: Math.random() > 0.4 ? hazardTypes.slice(0, Math.floor(Math.random() * 3) + 1) : []
    });
  }
  
  return holes;
};

export const enhancedNYCourses: Course[] = [
  // Premier Championship Courses
  {
    name: "Bethpage Black Course",
    location: "Farmingdale, NY",
    architect: "A.W. Tillinghast",
    yearBuilt: 1936,
    holes: generateHoles(18, 72, 'longisland'),
    phoneNumber: "(516) 249-0700",
    website: "https://www.bethpagegolf.com",
    photos: generateCoursePhotos(),
    amenities: ["Pro Shop", "Restaurant", "Driving Range", "Putting Green", "Cart Rental", "Club Rental", "Lessons Available", "Event Space"],
    greenFees: { weekday: 85, weekend: 120, twilight: 65 },
    description: "Host of the 2002 and 2009 U.S. Opens, this championship course is known for its challenging layout and pristine conditions."
  },
  {
    name: "Winged Foot Golf Club",
    location: "Mamaroneck, NY",
    architect: "A.W. Tillinghast",
    yearBuilt: 1923,
    holes: generateHoles(18, 72, 'westchester'),
    phoneNumber: "(914) 698-8400",
    photos: generateCoursePhotos(),
    amenities: ["Pro Shop", "Restaurant", "Driving Range", "Putting Green", "Locker Rooms", "Event Space", "Bar & Grill"],
    greenFees: { weekday: 350, weekend: 450, twilight: 250 },
    description: "One of America's most prestigious golf clubs, hosting multiple U.S. Opens and PGA Championships."
  },
  {
    name: "Shinnecock Hills Golf Club",
    location: "Southampton, NY",
    architect: "William Flynn",
    yearBuilt: 1916,
    holes: generateHoles(18, 70, 'longisland'),
    phoneNumber: "(631) 283-3525",
    photos: generateCoursePhotos(),
    amenities: ["Pro Shop", "Restaurant", "Putting Green", "Locker Rooms", "Event Space"],
    greenFees: { weekday: 400, weekend: 500, twilight: 300 },
    description: "America's oldest golf club in continuous use, known for its links-style layout and spectacular ocean views."
  },

  // NYC Public Courses
  {
    name: "Van Cortlandt Park Golf Course",
    location: "Bronx, NY",
    architect: "Tom Bendelow",
    yearBuilt: 1895,
    holes: generateHoles(18, 70, 'nyc'),
    phoneNumber: "(718) 543-4595",
    photos: generateCoursePhotos(),
    amenities: ["Pro Shop", "Restaurant", "Driving Range", "Cart Rental", "Lessons Available"],
    greenFees: { weekday: 42, weekend: 55, twilight: 32 },
    description: "America's first public golf course, offering a historic playing experience in the heart of the Bronx."
  },
  {
    name: "Forest Park Golf Course",
    location: "Queens, NY",
    yearBuilt: 1896,
    holes: generateHoles(18, 70, 'nyc'),
    phoneNumber: "(718) 296-0999",
    photos: generateCoursePhotos(),
    amenities: ["Pro Shop", "Restaurant", "Driving Range", "Putting Green", "Cart Rental"],
    greenFees: { weekday: 45, weekend: 58, twilight: 35 },
    description: "A challenging parkland course with mature trees and well-maintained greens in the heart of Queens."
  },
  {
    name: "Dyker Beach Golf Course",
    location: "Brooklyn, NY",
    yearBuilt: 1897,
    holes: generateHoles(18, 71, 'nyc'),
    phoneNumber: "(718) 836-9722",
    photos: generateCoursePhotos(),
    amenities: ["Pro Shop", "Restaurant", "Driving Range", "Putting Green", "Cart Rental", "Lessons Available"],
    greenFees: { weekday: 48, weekend: 62, twilight: 38 },
    description: "Brooklyn's premier public golf course featuring rolling hills and scenic views of the Verrazano Bridge."
  },

  // Long Island Golf Courses
  {
    name: "Pine Ridge Golf Club",
    location: "Coram, NY",
    architect: "Robert Trent Jones",
    yearBuilt: 1963,
    holes: generateHoles(18, 70, 'longisland'),
    phoneNumber: "(631) 345-2100",
    photos: generateCoursePhotos(),
    amenities: ["Pro Shop", "Restaurant", "Driving Range", "Putting Green", "Cart Rental", "Bar & Grill"],
    greenFees: { weekday: 68, weekend: 85, twilight: 52 },
    description: "A championship layout with pristine conditions and challenging water hazards throughout."
  },
  {
    name: "Rock Hill Golf & Country Club",
    location: "Manorville, NY",
    architect: "Pete Dye",
    yearBuilt: 1991,
    holes: generateHoles(18, 72, 'longisland'),
    phoneNumber: "(631) 878-2250",
    photos: generateCoursePhotos(),
    amenities: ["Pro Shop", "Restaurant", "Driving Range", "Putting Green", "Cart Rental", "Event Space", "Locker Rooms"],
    greenFees: { weekday: 95, weekend: 125, twilight: 75 },
    description: "A Pete Dye masterpiece featuring dramatic elevation changes and strategic bunkering."
  },

  // Westchester County Courses
  {
    name: "Westchester Country Club",
    location: "Rye, NY",
    architect: "Walter Travis",
    yearBuilt: 1922,
    holes: generateHoles(18, 72, 'westchester'),
    phoneNumber: "(914) 967-6000",
    photos: generateCoursePhotos(),
    amenities: ["Pro Shop", "Restaurant", "Driving Range", "Putting Green", "Locker Rooms", "Event Space", "Bar & Grill"],
    greenFees: { weekday: 275, weekend: 350, twilight: 200 },
    description: "Host of the annual BMW Championship, featuring immaculate conditions and challenging hole designs."
  },
  {
    name: "Sleepy Hollow Country Club",
    location: "Scarborough, NY",
    architect: "Charles Blair Macdonald",
    yearBuilt: 1911,
    holes: generateHoles(18, 70, 'westchester'),
    phoneNumber: "(914) 631-3333",
    photos: generateCoursePhotos(),
    amenities: ["Pro Shop", "Restaurant", "Putting Green", "Locker Rooms", "Event Space"],
    greenFees: { weekday: 300, weekend: 400, twilight: 225 },
    description: "A historic course with stunning Hudson River views and classic golden age architecture."
  },

  // Upstate New York Courses
  {
    name: "Turning Stone Resort Casino",
    location: "Verona, NY",
    architect: "Tom Fazio",
    yearBuilt: 2000,
    holes: generateHoles(18, 72, 'upstate'),
    phoneNumber: "(315) 361-7711",
    photos: generateCoursePhotos(),
    amenities: ["Pro Shop", "Restaurant", "Driving Range", "Putting Green", "Cart Rental", "Lessons Available", "Event Space", "Bar & Grill"],
    greenFees: { weekday: 125, weekend: 165, twilight: 95 },
    description: "A championship resort course featuring dramatic elevation changes and pristine conditioning year-round."
  },
  {
    name: "Skaneateles Country Club",
    location: "Skaneateles, NY",
    architect: "Donald Ross",
    yearBuilt: 1904,
    holes: generateHoles(18, 71, 'upstate'),
    phoneNumber: "(315) 685-3431",
    photos: generateCoursePhotos(),
    amenities: ["Pro Shop", "Restaurant", "Putting Green", "Locker Rooms", "Event Space"],
    greenFees: { weekday: 85, weekend: 110, twilight: 65 },
    description: "A classic Donald Ross design overlooking beautiful Skaneateles Lake with challenging greens."
  },

  // Central New York Courses
  {
    name: "Drumlins Country Club",
    location: "Syracuse, NY",
    architect: "Robert Trent Jones",
    yearBuilt: 1963,
    holes: generateHoles(18, 72, 'central'),
    phoneNumber: "(315) 446-5144",
    photos: generateCoursePhotos(),
    amenities: ["Pro Shop", "Restaurant", "Driving Range", "Putting Green", "Cart Rental", "Event Space"],
    greenFees: { weekday: 55, weekend: 72, twilight: 42 },
    description: "Two championship courses designed by Robert Trent Jones featuring rolling terrain and mature trees."
  },

  // Western New York Courses
  {
    name: "Oak Hill Country Club",
    location: "Rochester, NY",
    architect: "Ross & Tillinghast",
    yearBuilt: 1901,
    holes: generateHoles(18, 70, 'western'),
    phoneNumber: "(585) 586-1660",
    photos: generateCoursePhotos(),
    amenities: ["Pro Shop", "Restaurant", "Driving Range", "Putting Green", "Locker Rooms", "Event Space"],
    greenFees: { weekday: 195, weekend: 250, twilight: 145 },
    description: "Host of multiple major championships, known for its challenging layout and impeccable conditioning."
  }
];

// Export for backward compatibility
export const expandedNYCourses = enhancedNYCourses;