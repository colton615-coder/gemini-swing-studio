import { Course } from "@/types/golf";

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

const generateHoles = (numHoles: number, coursePar: number, region: 'nyc' | 'longisland' | 'westchester' | 'upstate' | 'central' | 'western') => {
  const holes = [];
  const baseCoords = generateNYCoordinates(region);
  
  const parDistribution = numHoles === 18 
    ? [4,4,3,4,5,3,4,4,4,4,4,3,5,4,4,3,4,5] // Standard 18-hole par distribution
    : Array(numHoles).fill(0).map((_, i) => 
        i % 6 === 2 || i % 6 === 5 ? 3 : i % 6 === 4 ? 5 : 4); // 9-hole distribution
  
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
    
    holes.push({
      holeNumber: i + 1,
      par: parDistribution[i] || 4,
      teeCoords,
      greenCoords
    });
  }
  
  return holes;
};

export const expandedNYCourses: Course[] = [
  // Existing courses
  {
    name: "Bethpage Black Course",
    location: "Farmingdale, NY",
    holes: generateHoles(18, 72, 'longisland')
  },
  {
    name: "Van Cortlandt Park Golf Course",
    location: "Bronx, NY",
    holes: generateHoles(18, 70, 'nyc')
  },
  {
    name: "Forest Park Golf Course",
    location: "Queens, NY",
    holes: generateHoles(18, 70, 'nyc')
  },
  {
    name: "Dyker Beach Golf Course",
    location: "Brooklyn, NY",
    holes: generateHoles(18, 71, 'nyc')
  },
  {
    name: "Pelham Bay & Split Rock Golf Course",
    location: "Bronx, NY",
    holes: generateHoles(18, 71, 'nyc')
  },

  // NYC Additional Courses
  {
    name: "Clearview Park Golf Course",
    location: "Queens, NY",
    holes: generateHoles(18, 70, 'nyc')
  },
  {
    name: "Douglaston Golf Course",
    location: "Queens, NY",
    holes: generateHoles(18, 71, 'nyc')
  },
  {
    name: "Kissena Golf Course",
    location: "Queens, NY",
    holes: generateHoles(18, 64, 'nyc')
  },
  {
    name: "Bally's Golf Links at Ferry Point Park",
    location: "Bronx, NY",
    holes: generateHoles(18, 72, 'nyc')
  },
  {
    name: "Mosholu Golf Course",
    location: "Bronx, NY",
    holes: generateHoles(9, 35, 'nyc')
  },
  {
    name: "Marine Park Golf Course",
    location: "Brooklyn, NY",
    holes: generateHoles(18, 72, 'nyc')
  },
  {
    name: "LaTourette Golf Course",
    location: "Staten Island, NY",
    holes: generateHoles(18, 72, 'nyc')
  },
  {
    name: "Silver Lake Golf Course",
    location: "Staten Island, NY",
    holes: generateHoles(18, 69, 'nyc')
  },
  {
    name: "South Shore Golf Course",
    location: "Staten Island, NY",
    holes: generateHoles(18, 72, 'nyc')
  },

  // NY State Park Courses
  {
    name: "Bethpage Blue Course",
    location: "Farmingdale, NY",
    holes: generateHoles(18, 72, 'longisland')
  },
  {
    name: "Bethpage Green Course",
    location: "Farmingdale, NY",
    holes: generateHoles(18, 71, 'longisland')
  },
  {
    name: "Bethpage Red Course",
    location: "Farmingdale, NY",
    holes: generateHoles(18, 70, 'longisland')
  },
  {
    name: "Bethpage Yellow Course",
    location: "Farmingdale, NY",
    holes: generateHoles(18, 71, 'longisland')
  },
  {
    name: "Montauk Downs State Park Golf Course",
    location: "Montauk, NY",
    holes: generateHoles(18, 72, 'longisland')
  },
  {
    name: "Sunken Meadow State Park Golf Course",
    location: "Kings Park, NY",
    holes: generateHoles(27, 108, 'longisland')
  },
  {
    name: "Robert Moses State Park Pitch and Putt",
    location: "Babylon, NY",
    holes: generateHoles(18, 54, 'longisland')
  },
  {
    name: "Jones Beach State Park Golf Course",
    location: "Wantagh, NY",
    holes: generateHoles(18, 54, 'longisland')
  },
  {
    name: "Saratoga Spa State Park Golf Course",
    location: "Saratoga Springs, NY",
    holes: generateHoles(18, 72, 'upstate')
  },
  {
    name: "Green Lakes State Park Golf Course",
    location: "Fayetteville, NY",
    holes: generateHoles(18, 72, 'central')
  },
  {
    name: "James Baird State Park Golf Course",
    location: "Pleasant Valley, NY",
    holes: generateHoles(18, 71, 'westchester')
  },
  {
    name: "Rockland Lake State Park Golf Course",
    location: "Congers, NY",
    holes: generateHoles(36, 144, 'westchester')
  },
  {
    name: "Dinsmore Golf Course",
    location: "Staatsburg, NY",
    holes: generateHoles(18, 70, 'westchester')
  },
  {
    name: "Springbrook Greens State Golf Course",
    location: "Sterling, NY",
    holes: generateHoles(18, 72, 'central')
  },
  {
    name: "Indian Hills State Golf Course",
    location: "Painted Post, NY",
    holes: generateHoles(27, 108, 'western')
  },
  {
    name: "Soaring Eagles Golf Course at Mark Twain State Park",
    location: "Horseheads, NY",
    holes: generateHoles(18, 72, 'central')
  },
  {
    name: "St. Lawrence State Park Golf Course",
    location: "Ogdensburg, NY",
    holes: generateHoles(9, 36, 'upstate')
  },
  {
    name: "Sag Harbor State Golf Course",
    location: "Sag Harbor, NY",
    holes: generateHoles(9, 36, 'longisland')
  },
  {
    name: "Wellesley Island State Park Golf Course",
    location: "Fineview, NY",
    holes: generateHoles(9, 36, 'upstate')
  },
  {
    name: "Chenango Valley State Park Golf Course",
    location: "Chenango Forks, NY",
    holes: generateHoles(18, 72, 'central')
  },

  // Long Island Nassau County Courses
  {
    name: "Bay Park Golf Course",
    location: "East Rockaway, NY",
    holes: generateHoles(9, 35, 'longisland')
  },
  {
    name: "Cantiague Park Golf Course",
    location: "Hicksville, NY",
    holes: generateHoles(9, 35, 'longisland')
  },
  {
    name: "Christopher Morley Park Golf Course",
    location: "Roslyn, NY",
    holes: generateHoles(9, 35, 'longisland')
  },
  {
    name: "Eisenhower Park Red Course",
    location: "East Meadow, NY",
    holes: generateHoles(18, 72, 'longisland')
  },
  {
    name: "Eisenhower Park White Course",
    location: "East Meadow, NY",
    holes: generateHoles(18, 72, 'longisland')
  },
  {
    name: "Eisenhower Park Blue Course",
    location: "East Meadow, NY",
    holes: generateHoles(18, 72, 'longisland')
  },
  {
    name: "Glen Cove Golf Club",
    location: "Glen Cove, NY",
    holes: generateHoles(18, 72, 'longisland')
  },
  {
    name: "Harbor Links Championship Course",
    location: "Port Washington, NY",
    holes: generateHoles(18, 72, 'longisland')
  },
  {
    name: "Harbor Links Executive Course",
    location: "Port Washington, NY",
    holes: generateHoles(9, 35, 'longisland')
  },
  {
    name: "Lido Golf Club",
    location: "Lido Beach, NY",
    holes: generateHoles(18, 72, 'longisland')
  },
  {
    name: "Merrick Road Park Golf Course",
    location: "Merrick, NY",
    holes: generateHoles(9, 35, 'longisland')
  },
  {
    name: "North Woodmere Park Golf Course",
    location: "Valley Stream, NY",
    holes: generateHoles(9, 35, 'longisland')
  },
  {
    name: "Peninsula Golf Club",
    location: "Massapequa, NY",
    holes: generateHoles(9, 35, 'longisland')
  },
  {
    name: "The Golf Club at Middle Bay",
    location: "Oceanside, NY",
    holes: generateHoles(18, 72, 'longisland')
  },
  {
    name: "Town of Oyster Bay Golf Course",
    location: "Woodbury, NY",
    holes: generateHoles(18, 72, 'longisland')
  },

  // Long Island Suffolk County Courses
  {
    name: "Bergen Point Golf Course",
    location: "West Babylon, NY",
    holes: generateHoles(18, 71, 'longisland')
  },
  {
    name: "Brentwood Country Club",
    location: "Brentwood, NY",
    holes: generateHoles(18, 72, 'longisland')
  },
  {
    name: "Cedars Golf Club",
    location: "Cutchogue, NY",
    holes: generateHoles(9, 35, 'longisland')
  },
  {
    name: "Crab Meadow Golf Course",
    location: "Northport, NY",
    holes: generateHoles(18, 72, 'longisland')
  },
  {
    name: "Dix Hills Park Golf Course",
    location: "Dix Hills, NY",
    holes: generateHoles(9, 35, 'longisland')
  },
  {
    name: "Gull Haven Golf Club",
    location: "Central Islip, NY",
    holes: generateHoles(9, 35, 'longisland')
  },
  {
    name: "Heartland Golf Park",
    location: "Edgewood, NY",
    holes: generateHoles(9, 35, 'longisland')
  },
  {
    name: "Holbrook Country Club",
    location: "Holbrook, NY",
    holes: generateHoles(18, 72, 'longisland')
  },
  {
    name: "Indian Island Country Club",
    location: "Riverhead, NY",
    holes: generateHoles(18, 72, 'longisland')
  },
  {
    name: "Island's End Golf & Country Club",
    location: "Greenport, NY",
    holes: generateHoles(18, 72, 'longisland')
  },
  {
    name: "Links Course at Cherry Creek",
    location: "Riverhead, NY",
    holes: generateHoles(18, 72, 'longisland')
  },
  {
    name: "Middle Island Country Club",
    location: "Middle Island, NY",
    holes: generateHoles(18, 72, 'longisland')
  },
  {
    name: "Montauk Club",
    location: "Montauk, NY",
    holes: generateHoles(9, 35, 'longisland')
  },
  {
    name: "Poxabogue Golf Center",
    location: "Sagaponack, NY",
    holes: generateHoles(9, 35, 'longisland')
  },
  {
    name: "Reeves Bay Golf Club",
    location: "Riverhead, NY",
    holes: generateHoles(9, 35, 'longisland')
  },
  {
    name: "Rock Hill Golf & Country Club",
    location: "Manorville, NY",
    holes: generateHoles(18, 72, 'longisland')
  },
  {
    name: "Smithtown Landing Golf Club",
    location: "Smithtown, NY",
    holes: generateHoles(18, 72, 'longisland')
  },
  {
    name: "Southampton Golf Club",
    location: "Southampton, NY",
    holes: generateHoles(18, 72, 'longisland')
  },
  {
    name: "Southward Ho Country Club",
    location: "Bay Shore, NY",
    holes: generateHoles(18, 72, 'longisland')
  },
  {
    name: "Spring Lake Golf Club",
    location: "Middle Island, NY",
    holes: generateHoles(18, 72, 'longisland')
  },
  {
    name: "Timber Point Golf Course",
    location: "Great River, NY",
    holes: generateHoles(18, 72, 'longisland')
  },
  {
    name: "West Sayville Golf Course",
    location: "West Sayville, NY",
    holes: generateHoles(18, 72, 'longisland')
  },

  // Westchester County Courses
  {
    name: "Dunwoodie Golf Course",
    location: "Yonkers, NY",
    holes: generateHoles(18, 70, 'westchester')
  },
  {
    name: "Hudson Hills Golf Course",
    location: "Ossining, NY",
    holes: generateHoles(18, 71, 'westchester')
  },
  {
    name: "Maple Moor Golf Course",
    location: "White Plains, NY",
    holes: generateHoles(18, 72, 'westchester')
  },
  {
    name: "Mohansic Golf Course",
    location: "Yorktown Heights, NY",
    holes: generateHoles(18, 70, 'westchester')
  },
  {
    name: "Saxon Woods Golf Course",
    location: "Scarsdale, NY",
    holes: generateHoles(18, 71, 'westchester')
  },
  {
    name: "Sprain Lake Golf Course",
    location: "Yonkers, NY",
    holes: generateHoles(18, 70, 'westchester')
  },

  // Upstate NY Courses
  {
    name: "Amsterdam Municipal Golf Course",
    location: "Amsterdam, NY",
    holes: generateHoles(18, 72, 'upstate')
  },
  {
    name: "Colonie Golf & Country Club",
    location: "Colonie, NY",
    holes: generateHoles(18, 71, 'upstate')
  },
  {
    name: "Schenectady Municipal Golf Course",
    location: "Schenectady, NY",
    holes: generateHoles(18, 72, 'upstate')
  },
  {
    name: "Troy Country Club",
    location: "Troy, NY",
    holes: generateHoles(18, 72, 'upstate')
  },
  {
    name: "Ballston Spa Country Club",
    location: "Ballston Spa, NY",
    holes: generateHoles(18, 72, 'upstate')
  },

  // Central NY Courses
  {
    name: "Arrowhead Golf Course",
    location: "Akron, NY",
    holes: generateHoles(18, 72, 'central')
  },
  {
    name: "Bellevue Country Club",
    location: "Syracuse, NY",
    holes: generateHoles(18, 72, 'central')
  },
  {
    name: "Drumlins Country Club East",
    location: "Syracuse, NY",
    holes: generateHoles(18, 72, 'central')
  },
  {
    name: "Drumlins Country Club West",
    location: "Syracuse, NY",
    holes: generateHoles(18, 72, 'central')
  },
  {
    name: "Highland Park Golf Course",
    location: "Syracuse, NY",
    holes: generateHoles(18, 70, 'central')
  },
  {
    name: "Skaneateles Country Club",
    location: "Skaneateles, NY",
    holes: generateHoles(18, 72, 'central')
  },
  {
    name: "Turning Stone Resort Casino Golf Courses",
    location: "Verona, NY",
    holes: generateHoles(54, 216, 'central')
  },

  // Western NY Courses
  {
    name: "Delaware Park Golf Course",
    location: "Buffalo, NY",
    holes: generateHoles(18, 72, 'western')
  },
  {
    name: "Grover Cleveland Golf Course",
    location: "Buffalo, NY",
    holes: generateHoles(18, 71, 'western')
  },
  {
    name: "South Park Golf Course",
    location: "Buffalo, NY",
    holes: generateHoles(18, 72, 'western')
  },
  {
    name: "Niagara Falls Country Club",
    location: "Niagara Falls, NY",
    holes: generateHoles(18, 72, 'western')
  },
  {
    name: "Hyde Park Golf Course",
    location: "Niagara Falls, NY",
    holes: generateHoles(18, 72, 'western')
  },
  {
    name: "Lockport Town & Country Club",
    location: "Lockport, NY",
    holes: generateHoles(18, 72, 'western')
  },
  {
    name: "Crag Burn Golf Club",
    location: "East Aurora, NY",
    holes: generateHoles(18, 72, 'western')
  },
  {
    name: "Elmwood Country Club",
    location: "Batavia, NY",
    holes: generateHoles(18, 72, 'western')
  },
  {
    name: "Genesee Valley Golf Club",
    location: "Rochester, NY",
    holes: generateHoles(18, 72, 'western')
  },
  {
    name: "Oak Hill Country Club East",
    location: "Rochester, NY",
    holes: generateHoles(18, 72, 'western')
  },
  {
    name: "Oak Hill Country Club West",
    location: "Rochester, NY",
    holes: generateHoles(18, 72, 'western')
  },

  // Additional NYC Area Courses
  {
    name: "Trump Golf Links at Ferry Point",
    location: "Bronx, NY",
    holes: generateHoles(18, 72, 'nyc')
  },
  {
    name: "Flushing Meadows Pitch & Putt",
    location: "Queens, NY",
    holes: generateHoles(18, 54, 'nyc')
  },
  {
    name: "Randalls Island Golf Center",
    location: "Manhattan, NY",
    holes: generateHoles(18, 54, 'nyc')
  },
  {
    name: "Chelsea Piers Golf Club",
    location: "Manhattan, NY",
    holes: generateHoles(18, 54, 'nyc')
  },
  {
    name: "Richmond County Country Club",
    location: "Staten Island, NY",
    holes: generateHoles(18, 72, 'nyc')
  },
  {
    name: "Freshkills Park Golf Course",
    location: "Staten Island, NY",
    holes: generateHoles(18, 72, 'nyc')
  },

  // Finger Lakes Region
  {
    name: "Seneca Lake Country Club",
    location: "Geneva, NY",
    holes: generateHoles(18, 72, 'central')
  },
  {
    name: "Canandaigua Country Club",
    location: "Canandaigua, NY",
    holes: generateHoles(18, 72, 'central')
  },
  {
    name: "Skaneateles Country Club",
    location: "Skaneateles, NY",
    holes: generateHoles(18, 72, 'central')
  },
  {
    name: "Auburn Golf & Country Club",
    location: "Auburn, NY",
    holes: generateHoles(18, 72, 'central')
  },
  {
    name: "Owasco Country Club",
    location: "Auburn, NY",
    holes: generateHoles(18, 72, 'central')
  },

  // Hudson Valley
  {
    name: "Apple Greens Golf Course",
    location: "Highland, NY",
    holes: generateHoles(18, 72, 'westchester')
  },
  {
    name: "McCann Memorial Golf Course",
    location: "Poughkeepsie, NY",
    holes: generateHoles(18, 72, 'westchester')
  },
  {
    name: "Dutchess Golf & Country Club",
    location: "Poughkeepsie, NY",
    holes: generateHoles(18, 71, 'westchester')
  },
  {
    name: "Vassar Golf & Country Club",
    location: "Poughkeepsie, NY",
    holes: generateHoles(18, 72, 'westchester')
  },
  {
    name: "Wallkill Golf Club",
    location: "Middletown, NY",
    holes: generateHoles(18, 72, 'westchester')
  },
  {
    name: "New Paltz Golf Course",
    location: "New Paltz, NY",
    holes: generateHoles(18, 72, 'westchester')
  },

  // Capital District
  {
    name: "Capital Hills at Albany",
    location: "Albany, NY",
    holes: generateHoles(18, 72, 'upstate')
  },
  {
    name: "Normanside Country Club",
    location: "Delmar, NY",
    holes: generateHoles(18, 72, 'upstate')
  },
  {
    name: "Shaker Ridge Country Club",
    location: "Albany, NY",
    holes: generateHoles(18, 72, 'upstate')
  },
  {
    name: "Town of Colonie Golf Course",
    location: "Colonie, NY",
    holes: generateHoles(18, 72, 'upstate')
  },
  {
    name: "Frear Park Golf Course",
    location: "Troy, NY",
    holes: generateHoles(18, 70, 'upstate')
  },

  // North Country
  {
    name: "Adirondack Golf & Country Club",
    location: "Peru, NY",
    holes: generateHoles(18, 72, 'upstate')
  },
  {
    name: "Malone Golf Club",
    location: "Malone, NY",
    holes: generateHoles(18, 72, 'upstate')
  },
  {
    name: "Plattsburgh Country Club",
    location: "Plattsburgh, NY",
    holes: generateHoles(18, 72, 'upstate')
  },
  {
    name: "Tupper Lake Golf Club",
    location: "Tupper Lake, NY",
    holes: generateHoles(18, 72, 'upstate')
  },
  {
    name: "Clifton Springs Country Club",
    location: "Clifton Springs, NY",
    holes: generateHoles(18, 72, 'central')
  }
];
